import { create } from 'zustand';
import axios from 'axios';
import { loadMe, updateMe } from '../../user/user';
import { AuthStatus, ApiStatus } from '../auth.status';
import { useStationStore } from '../../station/store/useStationStore';
import { useAccountStore } from '../../user/store/useAccountStore';
import { useUserStore } from '../../user/store/useUserStore';
import { useActiveSessionStore } from '../../session/store/useActiveSessionStore';
import { registerPushTokenIfGranted, resetPushRegistrationState } from '../../notifications/push';
import { useNotificationsStore } from '../../notifications/store/useNotificationsStore';
import { refreshAccessToken } from '../tokenLifecycle';
import {
  apiSyncFirebaseSession,
  apiLogout,
  resetBackendSessionSyncThrottle,
} from '../authApi';
import { getFirebaseAuth } from '../../../infrastructure/firebase/firebaseAuth';
import { ensureFirebaseAuthReady } from '../../../infrastructure/firebase/firebaseSession';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

function isFirebaseAuthError(e: unknown): e is { code: string; message?: string } {
  return (
    typeof e === 'object' &&
    e != null &&
    'code' in e &&
    typeof (e as any).code === 'string' &&
    (e as any).code.startsWith('auth/')
  );
}

function mapAuthError(e: unknown): string {
  // Firebase Auth: mostrar lo mínimo (sin rutas, códigos, ni detalles).
  if (isFirebaseAuthError(e)) {
    const code = e.code;
    // Credenciales inválidas (sign in)
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-email'
    ) {
      return 'Correo o contraseña incorrectos.';
    }
    // Registro
    if (code === 'auth/email-already-in-use') {
      return 'Este correo ya está registrado.';
    }
    if (code === 'auth/weak-password') {
      return 'La contraseña no cumple los requisitos.';
    }
    // Throttling / bloqueos
    if (code === 'auth/too-many-requests') {
      return 'Demasiados intentos. Espera e intenta de nuevo.';
    }
    // Default: no filtrar detalle técnico
    return 'Servicio no disponible. Intenta de nuevo.';
  }

  if (axios.isAxiosError(e)) {
    // Sin respuesta: red/servidor caído
    if (!e.response) {
      return 'Servicio no disponible. Intenta de nuevo.';
    }
    if (e.response?.status === 401) {
      return 'Correo o contraseña incorrectos.';
    }
    if (e.response?.status === 409) {
      return 'Este correo ya está registrado.';
    }
    if (e.response?.status === 429) {
      return 'Demasiados intentos. Espera e intenta de nuevo.';
    }
    return 'Servicio no disponible. Intenta de nuevo.';
  }
  return 'Servicio no disponible. Intenta de nuevo.';
}

export interface AuthState {
  isAuthenticated: AuthStatus;
  apiStatus: ApiStatus;

  completeEmailPasswordLogin: (
    email: string,
    password: string,
    mode: 'signin' | 'register',
    profile?: { firstName?: string; lastName?: string },
  ) => Promise<{ ok: boolean; errorMessage?: string }>;
  refresh: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  retryApiBootstrap: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const finalizeBackendSession = async (opts?: {
    /** Si false (login desde Auth), no pasamos a `checking` para no bloquear navegación ni duplicar el gate de carga. */
    showChecking?: boolean;
    /** true tras login/registro; evita omitir POST /auth/session por throttle local. */
    forceSessionSync?: boolean;
    /** Tras alta en Firebase: persiste nombre/apellido en Postgres antes de loadMe. */
    registerProfile?: { firstName: string; lastName: string };
  }): Promise<
    'success' | 'transport' | 'server' | 'auth' | 'no_token'
  > => {
    if (opts?.showChecking !== false) {
      set({ isAuthenticated: 'checking', apiStatus: 'unknown' });
    }
    // Firebase Auth: el Bearer se obtiene desde `getFirebaseIdToken()` (interceptor).
    await ensureFirebaseAuthReady();
    const accessToken = (await refreshAccessToken()) ?? undefined;
    if (!accessToken) {
      set({
        isAuthenticated: 'unauthenticated',
        apiStatus: 'unknown',
      });
      useUserStore.getState().clearUser();
      return 'no_token';
    }

    try {
      await apiSyncFirebaseSession({ force: opts?.forceSessionSync === true });
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const s = e.response?.status;
        if (s === 401 || s === 403) {
          set({
            isAuthenticated: 'unauthenticated',
            apiStatus: 'unknown',
          });
          useUserStore.getState().clearUser();
          return 'auth';
        }
        // 429 solo aplica a POST /auth/session; el polling de sesión/QR/reservas no debe bloquear al usuario.
        if (s === 429) {
          if (__DEV__) {
            console.warn('[auth] POST /auth/session rate limited; se continúa con Bearer existente');
          }
        }
      }
    }

    if (opts?.registerProfile) {
      const { firstName, lastName } = opts.registerProfile;
      const updated = await updateMe(undefined, firstName, lastName);
      if (!updated && __DEV__) {
        console.warn('[auth] PATCH user/me on register failed');
      }
    }

    const me = await loadMe();

    if (me.ok) {
      useUserStore.getState().setUser(me.user);
      set({
        isAuthenticated: 'authenticated',
        apiStatus: 'reachable',
      });
      // No bloquear el login en car/me ni stations/map: si cuelgan o tardan, antes la UI quedaba en "checking" / cargando.
      void Promise.all([
        useAccountStore.getState().fetchVehicles(),
        useStationStore.getState().fetchStations(),
        useNotificationsStore.getState().loadNotifications(),
      ]).catch(() => {});
      registerPushTokenIfGranted().catch(() => {});
      return 'success';
    }

    if (me.kind === 'auth') {
      set({
        isAuthenticated: 'unauthenticated',
        apiStatus: 'unknown',
      });
      useUserStore.getState().clearUser();
      return 'auth';
    }

    useUserStore.getState().clearUser();
    if (me.kind === 'transport') {
      set({
        isAuthenticated: 'authenticated',
        apiStatus: 'unreachable',
      });
      return 'transport';
    }

    set({
      isAuthenticated: 'authenticated',
      apiStatus: 'error',
    });
    return 'server';
  };

  return {
    isAuthenticated: 'checking',
    apiStatus: 'unknown',

    completeEmailPasswordLogin: async (email, password, mode, profile) => {
      try {
        if (mode === 'register') {
          if (
            !profile?.firstName?.trim() ||
            !profile?.lastName?.trim()
          ) {
            return {
              ok: false,
              errorMessage: 'Indica nombre y apellido para registrarte.',
            };
          }
          await createUserWithEmailAndPassword(
            getFirebaseAuth(),
            email.trim(),
            password,
          );
        } else {
          await signInWithEmailAndPassword(
            getFirebaseAuth(),
            email.trim(),
            password,
          );
        }

        const outcome = await finalizeBackendSession({
          showChecking: false,
          forceSessionSync: true,
          ...(mode === 'register' && profile
            ? {
                registerProfile: {
                  firstName: profile.firstName!.trim(),
                  lastName: profile.lastName!.trim(),
                },
              }
            : {}),
        });

        if (outcome === 'auth' || outcome === 'no_token') {
          return {
            ok: false,
            errorMessage:
              outcome === 'no_token'
                ? 'No se obtuvo sesión. Intenta de nuevo.'
                : 'No se pudo validar tu sesión en el servidor.',
          };
        }
        if (outcome === 'transport' || outcome === 'server') {
          return { ok: true };
        }

        return { ok: true };
      } catch (e) {
        console.error('[auth] completeEmailPasswordLogin', e);
        set({
          isAuthenticated: 'unauthenticated',
          apiStatus: 'unknown',
        });
        useUserStore.getState().clearUser();
        return { ok: false, errorMessage: mapAuthError(e) };
      }
    },

    async refresh() {
      const me = await loadMe();
      if (me.ok) {
        useUserStore.getState().setUser(me.user);
        set({
          isAuthenticated: 'authenticated',
          apiStatus: 'reachable',
        });
        return;
      }
      if (me.kind === 'auth') {
        get().logout();
        return;
      }
      if (me.kind === 'transport') {
        set({ apiStatus: 'unreachable' });
      } else {
        set({ apiStatus: 'error' });
      }
    },

    async checkAuthStatus() {
      if (
        get().isAuthenticated === 'authenticated' &&
        get().apiStatus === 'reachable'
      ) {
        return;
      }

      try {
        await finalizeBackendSession();
      } catch (error) {
        console.error('Error in checkAuthStatus:', error);
        get().logout();
      }
    },

    async retryApiBootstrap() {
      const me = await loadMe();

      if (me.ok) {
        useUserStore.getState().setUser(me.user);
        await useAccountStore.getState().fetchVehicles();
        await useStationStore.getState().fetchStations();
        await useNotificationsStore.getState().loadNotifications();
        registerPushTokenIfGranted().catch(() => {});
        set({
          isAuthenticated: 'authenticated',
          apiStatus: 'reachable',
        });
        return;
      }

      if (me.kind === 'auth') {
        get().logout();
        return;
      }

      useUserStore.getState().clearUser();
      if (me.kind === 'transport') {
        set({
          isAuthenticated: 'authenticated',
          apiStatus: 'unreachable',
        });
        return;
      }
      set({
        isAuthenticated: 'authenticated',
        apiStatus: 'error',
      });
    },

    logout() {
      resetBackendSessionSyncThrottle();
      resetPushRegistrationState();
      void (async () => {
        await apiLogout();
        try {
          await signOut(getFirebaseAuth());
        } catch {
          // ignore
        }
      })();

      set({
        isAuthenticated: 'unauthenticated',
        apiStatus: 'unknown',
      });

      useUserStore.getState().clearUser();
      useActiveSessionStore.getState().clearActiveSession();
    },
  };
});
