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
