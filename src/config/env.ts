import { getExpoExtra } from './getExpoExtra';

const extra = getExpoExtra();

export const STAGE = (extra.STAGE as string) ?? 'dev';
export const API_URL = (extra.API_URL as string) ?? '';
export const API_URL_IOS = (extra.API_URL_IOS as string) ?? API_URL;
export const API_URL_ANDROID = (extra.API_URL_ANDROID as string) ?? API_URL;

export const FIREBASE_API_KEY = (extra.FIREBASE_API_KEY as string) ?? '';
export const FIREBASE_AUTH_DOMAIN = (extra.FIREBASE_AUTH_DOMAIN as string) ?? '';
export const FIREBASE_PROJECT_ID = (extra.FIREBASE_PROJECT_ID as string) ?? '';
export const FIREBASE_APP_ID = (extra.FIREBASE_APP_ID as string) ?? '';

/**
 * Assert HTTPS para todas las URLs de API en builds productivos (#2.4).
 *
 * En `dev` permitimos `http://` (LAN local). En cualquier otro stage cortamos
 * el boot si alguna URL no es HTTPS, porque el token de inscripción
 * Transbank y el JWT de Firebase viajan en esa conexión.
 *
 * No usamos `__DEV__` como condición porque queremos también proteger los
 * builds "preview" de EAS — solo `STAGE=dev` (override explícito) puede
 * romper la regla.
 */
function assertHttpsApiUrls(): void {
  if (STAGE === 'dev') return;
  const urls: Array<[string, string]> = [
    ['API_URL', API_URL],
    ['API_URL_IOS', API_URL_IOS],
    ['API_URL_ANDROID', API_URL_ANDROID],
  ];
  for (const [name, value] of urls) {
    if (!value) continue;
    if (!value.startsWith('https://')) {
      throw new Error(
        `[env] ${name} must use https in stage "${STAGE}" (got: ${value}). ` +
          'Refusing to boot to protect inscription/auth tokens.',
      );
    }
  }
}

assertHttpsApiUrls();
