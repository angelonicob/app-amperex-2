import { api } from '../../infrastructure/http/Api';
import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from '../../shared/config/legal';

export type RecordLegalAcceptanceResult =
  | { ok: true }
  | { ok: false; message: string };

export async function recordLegalAcceptance(
  termsVersion: string = LEGAL_TERMS_VERSION,
  privacyVersion: string = LEGAL_PRIVACY_VERSION,
): Promise<RecordLegalAcceptanceResult> {
  try {
    await api.post('user/legal-acceptance', {
      termsVersion,
      privacyVersion,
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        'No se pudo registrar la aceptación de términos. Inicia sesión e inténtalo de nuevo.',
    };
  }
}
