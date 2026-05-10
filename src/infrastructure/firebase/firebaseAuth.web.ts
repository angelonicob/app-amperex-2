import {
  type Auth,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from 'firebase/auth';
import { getFirebaseApp } from './firebaseClient';

let authSingleton: Auth | null = null;

/**
 * Auth con persistencia en localStorage (Expo web).
 * Si `initializeAuth` ya se ejecutó (p. ej. Fast Refresh), se usa `getAuth`.
 */
export function getFirebaseAuth(): Auth {
  if (authSingleton) {
    return authSingleton;
  }

  const app = getFirebaseApp();

  try {
    authSingleton = initializeAuth(app, {
      persistence: browserLocalPersistence,
    });
  } catch (e) {
    const code =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      typeof (e as { code: unknown }).code === 'string'
        ? (e as { code: string }).code
        : '';
    if (code === 'auth/already-initialized') {
      authSingleton = getAuth(app);
    } else {
      throw e;
    }
  }

  return authSingleton;
}
