/**
 * Configuración de Expo.
 *
 * Fuentes de variables de entorno (en orden de prioridad):
 * 1. Variables de entorno del sistema (export API_URL=...)
 * 2. Archivo .env (cargado por dotenv desde la raíz del proyecto)
 * 3. EAS Build: eas.json -> env (solo durante eas build)
 * 4. Fallbacks definidos abajo
 *
 * EAS Build (nube): el .env no se sube; define las mismas variables (API_*)
 * en el proyecto (expo.dev → Environment variables / secrets) para que existan en process.env
 * cuando se evalúa este archivo.
 *
 * Para desarrollo local: copia .env.template a .env y configura tus valores.
 *
 * --- Google Maps (react-native-maps + PROVIDER_GOOGLE) ---
 * Claves en app.json (NO uses el plugin "react-native-maps" en plugins: el paquete no trae
 * config plugin de Expo y rompe `expo config` / EAS).
 *
 * - Android: expo.android.config.googleMaps.apiKey  →  Maps SDK for Android en Google Cloud
 * - iOS:     expo.ios.config.googleMapsApiKey        →  Maps SDK for iOS en Google Cloud
 *
 * Puedes usar la misma clave en ambos si la creas sin restricción de app, o dos claves
 * distintas (recomendado): Android = package + SHA-1, iOS = bundle identifier.
 *
 * Firebase (FCM / expo-notifications en Android):
 * - Local: ./keys/google-services.json (no versionado; ver keys/.gitignore).
 * - EAS Build: variable de entorno tipo FILE `GOOGLE_SERVICES_JSON` en expo.dev
 *   (EAS inyecta la ruta al archivo en process.env durante el build).
 */
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
  override: true,
});

/** Quita espacios y comillas envolventes típicas de .env */
function envStr(key, fallback = '') {
  const v = process.env[key];
  if (v == null || v === '') return fallback;
  return String(v).trim().replace(/^["']|["']$/g, '');
}

/** Ruta a google-services.json: EAS (file env) o repo local. */
const googleServicesFile =
  envStr('GOOGLE_SERVICES_JSON') || './keys/google-services.json';

export default ({ config }) => {
  const env = {
    STAGE: envStr('STAGE', 'dev'),
    API_URL: envStr('API_URL', 'http://192.168.8.199:4000/api/v1/mobile'),
    API_URL_IOS: envStr('API_URL_IOS', envStr('API_URL', 'http://192.168.8.199:4000/api/v1/mobile')),
    API_URL_ANDROID: envStr('API_URL_ANDROID', envStr('API_URL', 'http://192.168.8.199:4000/api/v1/mobile')),
    EXPO_ACCOUNT_OWNER: envStr('EXPO_ACCOUNT_OWNER'),
    // Firebase JS SDK (Auth): required for email/password in the app.
    FIREBASE_API_KEY: envStr('FIREBASE_API_KEY'),
    FIREBASE_AUTH_DOMAIN: envStr('FIREBASE_AUTH_DOMAIN'),
    FIREBASE_PROJECT_ID: envStr('FIREBASE_PROJECT_ID'),
    FIREBASE_APP_ID: envStr('FIREBASE_APP_ID'),
    LEGAL_TERMS_URL: envStr(
      'LEGAL_TERMS_URL',
      'https://amperex.cl/terminos-y-condiciones/',
    ),
    LEGAL_PRIVACY_URL: envStr(
      'LEGAL_PRIVACY_URL',
      'https://amperex.cl/politica-de-privacidad/',
    ),
    LEGAL_TERMS_VERSION: envStr('LEGAL_TERMS_VERSION', '1.0'),
    LEGAL_PRIVACY_VERSION: envStr('LEGAL_PRIVACY_VERSION', '1.0'),
  };

  return {
    ...config,
    extra: {
      ...config.extra,
      ...env,
    },
    ios: {
      ...config.ios,
      config: config.ios?.config ?? {},
    },
    android: {
      ...config.android,
      googleServicesFile,
      // #2.4: cleartext (HTTP) solo en dev/preview, NUNCA en producción.
      // En dev se necesita para `http://192.168.x.x` contra el backend local.
      // `STAGE === 'prod'` apaga el flag y el sistema Android bloquea cualquier
      // tráfico HTTP residual aunque el código tenga una URL mal configurada.
      usesCleartextTraffic: env.STAGE !== 'prod',
      config: config.android?.config ?? {},
    },
  };
};
