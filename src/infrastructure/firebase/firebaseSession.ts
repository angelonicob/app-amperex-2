import { getFirebaseAuth } from './firebaseAuth';
import { onAuthStateChanged } from 'firebase/auth';

let idTokenInFlight: Promise<string | null> | null = null;

/**
 * Espera a que Firebase termine de hidratar la sesión desde persistencia (AsyncStorage en nativo).
 * Sin esto, `currentUser` puede ser null justo al abrir la app y se pierde la sesión aunque exista.
 */
export async function ensureFirebaseAuthReady(): Promise<void> {
  const auth = getFirebaseAuth();

  // En algunos escenarios RN/Expo, `authStateReady()` puede quedar colgado.
  // No debemos bloquear el arranque indefinidamente.
  const timeoutMs = 5000;

  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs);
  });

  const authStateChangedOnce = new Promise<void>((resolve) => {
    const unsub = onAuthStateChanged(
      auth,
      () => {
        unsub();
        resolve();
      },
      () => {
        unsub();
        resolve();
      },
    );
  });

  await Promise.race([auth.authStateReady(), authStateChangedOnce, timeout]);

  if (__DEV__) {
    // Log mínimo para diagnosticar “Loading” infinito.
    const uid = auth.currentUser?.uid;
    console.log('[firebase] ensureFirebaseAuthReady done', {
      hasUser: Boolean(uid),
      uid: uid ?? null,
      timeoutMs,
    });
  }
}

export async function getFirebaseIdToken(params?: {
  forceRefresh?: boolean;
}): Promise<string | null> {
  const forceRefresh = params?.forceRefresh === true;
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;

  if (idTokenInFlight && !forceRefresh) return idTokenInFlight;

  idTokenInFlight = (async () => {
    try {
      return await user.getIdToken(forceRefresh);
    } catch {
      return null;
    } finally {
      idTokenInFlight = null;
    }
  })();

  return idTokenInFlight;
}

