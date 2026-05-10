import { api } from './Api';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';
import { getFirebaseIdToken } from '../firebase/firebaseSession';
import { getFirebaseAuth } from '../firebase/firebaseAuth';

function logNetworkError(error: unknown) {
  if (__DEV__) {
    const msg =
      error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : String(error);
    const url =
      error &&
      typeof error === 'object' &&
      'config' in error &&
      error.config &&
      typeof (error.config as { url?: string }).url === 'string'
        ? (error.config as { url: string }).url
        : '';
    console.error('[API] Network error:', msg, url || '', error);
  }
}

function skipBearer(url: string): boolean {
  return (
    // Firebase Auth happens client-side; backend endpoints remain protected.
    // Keep this for legacy endpoints or unauthenticated routes if any are added later.
    url.includes('/__health__')
  );
}

export function setupApiAuth() {
  api.interceptors.request.use(async (config) => {
    const url = config.url || '';
    if (url.includes('/__health__')) return config;

    if (skipBearer(url)) {
      return config;
    }

    const token = await getFirebaseIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__ && url.includes('user/me')) {
      const u = getFirebaseAuth().currentUser;
      console.log('[API][auth] request', {
        url,
        hasBearer: Boolean(token),
        firebaseUid: u?.uid,
        email: u?.email,
      });
    }

    return config;
  });

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;
      if (!originalRequest) {
        logNetworkError(error);
        return Promise.reject(error);
      }

      const url = originalRequest.url || '';
      const status = error.response?.status;
      const code =
        error.response?.data &&
        typeof error.response.data === 'object' &&
        'code' in error.response.data
          ? String((error.response.data as { code: unknown }).code)
          : '';

      if (status === 503 || (!error.response && error.request)) {
        if (__DEV__) {
          console.warn(
            '[API] Maintenance or network error:',
            status || 'no response',
            url,
          );
        }
        return Promise.reject(error);
      }

      if (originalRequest._retry === true) {
        if (status === 401 && !skipBearer(url)) {
          useAuthStore.getState().logout();
        }
        logNetworkError(error);
        return Promise.reject(error);
      }

      if (status === 401 && !skipBearer(url)) {
        originalRequest._retry = true;
        try {
          const token = await getFirebaseIdToken({ forceRefresh: true });
          if (!token) {
            throw new Error('No token refresh');
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      }

      logNetworkError(error);
      return Promise.reject(error);
    },
  );
}
