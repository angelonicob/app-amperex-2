import { api } from '../../infrastructure/http/Api';
import { getFirebaseAuth } from '../../infrastructure/firebase/firebaseAuth';
import { signOut } from 'firebase/auth';
import { useActiveSessionStore } from '../session/store/useActiveSessionStore';

/** Evita golpear POST /auth/session (rate limit Redis) en reintentos de bootstrap. */
const BACKEND_SESSION_SYNC_MIN_MS = 5 * 60 * 1000;
let lastBackendSessionSyncAt = 0;

/**
 * Sincroniza usuario en backend tras login Firebase (Bearer = ID token).
 * Solo este endpoint usa el rate limit `mobile_firebase_establish` en el backend.
 */
export async function apiSyncFirebaseSession(opts?: {
  /** true tras login explícito; false en re-hidratación de la app. */
  force?: boolean;
}): Promise<void> {
  const now = Date.now();
  if (!opts?.force && now - lastBackendSessionSyncAt < BACKEND_SESSION_SYNC_MIN_MS) {
    return;
  }
  await api.post('/auth/session', undefined, {
    headers: opts?.force
      ? { 'X-Amperex-Session-Establish': 'login' }
      : undefined,
  });
  if (opts?.force) {
    useActiveSessionStore.getState().clearActiveSession();
  }
  lastBackendSessionSyncAt = now;
}

export function resetBackendSessionSyncThrottle(): void {
  lastBackendSessionSyncAt = 0;
}

export async function apiLogout(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* ignorar red */
  }
}
