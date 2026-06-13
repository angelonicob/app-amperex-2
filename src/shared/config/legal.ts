import Constants from 'expo-constants';

type LegalExtra = {
  LEGAL_TERMS_URL?: string;
  LEGAL_PRIVACY_URL?: string;
  LEGAL_TERMS_VERSION?: string;
  LEGAL_PRIVACY_VERSION?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as LegalExtra;

export const LEGAL_TERMS_URL =
  extra.LEGAL_TERMS_URL?.trim() ||
  'https://amperex.cl/terminos-y-condiciones/';

export const LEGAL_PRIVACY_URL =
  extra.LEGAL_PRIVACY_URL?.trim() ||
  'https://amperex.cl/politica-de-privacidad/';

export const LEGAL_TERMS_VERSION = extra.LEGAL_TERMS_VERSION?.trim() || '1.0';

export const LEGAL_PRIVACY_VERSION =
  extra.LEGAL_PRIVACY_VERSION?.trim() || '1.0';

export const LEGAL_TERMS_TITLE = 'Términos y condiciones de uso';
export const LEGAL_PRIVACY_TITLE = 'Política de privacidad';
