import axios from 'axios';
import { Platform } from 'react-native';
import { STAGE, API_URL as PROD_URL, API_URL_IOS, API_URL_ANDROID } from '../../config/env';

/** Evita requests colgados; alinea instancia y default. */
const API_TIMEOUT_MS = 15_000;

function pickApiUrl(): string {
  if (STAGE === 'production') return PROD_URL;
  if (Platform.OS === 'ios') return API_URL_IOS;
  return API_URL_ANDROID;
}

/** Siempre la URL definida en app.config / `.env` (extra); sin reescrituras automáticas. */
export const API_URL = pickApiUrl();

axios.defaults.timeout = API_TIMEOUT_MS;

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'X-Amperex-Client': 'mobile',
  },
});

if (__DEV__) {
  console.log('[API] baseURL', API_URL, { stage: STAGE, platform: Platform.OS });
}

export { api };
