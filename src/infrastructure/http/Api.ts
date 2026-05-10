import axios from 'axios';
import { Platform } from 'react-native';
import { STAGE, API_URL as PROD_URL, API_URL_IOS, API_URL_ANDROID } from '../../config/env';

/** Evita requests colgados; alinea instancia y default. */
const API_TIMEOUT_MS = 15_000;

export const API_URL =
  STAGE === 'production'
    ? PROD_URL
    : Platform.OS === 'ios'
      ? API_URL_IOS
      : API_URL_ANDROID;

axios.defaults.timeout = API_TIMEOUT_MS;

const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'X-Amperex-Client': 'mobile',
  },
});

export { api };
