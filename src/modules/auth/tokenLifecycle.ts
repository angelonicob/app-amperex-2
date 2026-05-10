import { getFirebaseIdToken } from '../../infrastructure/firebase/firebaseSession';

/**
 * Obtiene el ID token actual. Por defecto usa caché de Firebase y solo refresca en red si hace falta.
 * Evita latencia extra al arrancar (antes se forzaba refresh en cada bootstrap).
 */
export async function refreshAccessToken(): Promise<string | null> {
  return await getFirebaseIdToken({ forceRefresh: false });
}
