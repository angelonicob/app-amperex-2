import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
} from '../../config/env';

function requireEnv(name: string, value: string): string {
  const v = (value ?? '').trim();
  if (!v) {
    throw new Error(
      `[firebase] Missing ${name}. Configure it in .env / EAS env and expose via app.config.js extra.`,
    );
  }
  return v;
}

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();

  return initializeApp({
    apiKey: requireEnv('FIREBASE_API_KEY', FIREBASE_API_KEY),
    authDomain:
      (FIREBASE_AUTH_DOMAIN ?? '').trim() ||
      `${requireEnv('FIREBASE_PROJECT_ID', FIREBASE_PROJECT_ID)}.firebaseapp.com`,
    projectId: requireEnv('FIREBASE_PROJECT_ID', FIREBASE_PROJECT_ID),
    appId: requireEnv('FIREBASE_APP_ID', FIREBASE_APP_ID),
  });
}
