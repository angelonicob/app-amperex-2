import { api } from '../../infrastructure/http/Api';
import { getFirebaseAuth } from '../../infrastructure/firebase/firebaseAuth';
import { signOut } from 'firebase/auth';

export async function apiRegister(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<void> {
  // Deprecated with Firebase Auth (client-side).
  // Intentionally a no-op to avoid calling legacy password endpoints.
  void params;
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<void> {
  // Deprecated with Firebase Auth (client-side).
  // Intentionally a no-op to avoid calling legacy password endpoints.
  void email;
  void password;
}

/** Sincroniza usuario en backend tras login Firebase (Bearer = ID token). */
export async function apiSyncFirebaseSession(): Promise<void> {
  await api.post('/auth/session', undefined);
}

export async function apiLogout(): Promise<void> {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    /* ignorar red */
  }
}
