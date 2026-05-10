import type { Auth, Persistence } from 'firebase/auth';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseApp } from './firebaseClient';

let authSingleton: Auth | null = null;

type FirebaseAuthWithRnPersistence = typeof import('firebase/auth') & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

function getReactNativePersistence(storage: typeof AsyncStorage): Persistence {
  // En RN, Metro resuelve `firebase/auth` al bundle de `@firebase/auth` con AsyncStorage.
  // Ese símbolo no está en los .d.ts del entry web que usa `tsc`.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('firebase/auth') as FirebaseAuthWithRnPersistence;
  return mod.getReactNativePersistence(storage);
}

/**
 * Auth con persistencia en AsyncStorage (iOS/Android).
 * Si `initializeAuth` ya se ejecutó (p. ej. Fast Refresh), se usa `getAuth`.
 */
export function getFirebaseAuth(): Auth {
  if (authSingleton) {
    return authSingleton;
  }

  const app = getFirebaseApp();

  try {
    authSingleton = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
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
