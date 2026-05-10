import { isAxiosError, type AxiosError } from 'axios';

export type ApiFailureKind =
  | 'transport'
  | 'server'
  | 'auth'
  | 'client'
  | 'unknown';

/**
 * Clasifica errores Axios para UX: offline solo para fallo de transporte (sin respuesta HTTP).
 * 5xx → server (pantalla distinta a offline). 401 → auth.
 */
export function classifyApiFailure(error: unknown): ApiFailureKind {
  if (!isAxiosError(error)) {
    return 'unknown';
  }
  const ax = error as AxiosError;
  const status = ax.response?.status;
  if (status !== undefined) {
    if (status === 401) return 'auth';
    if (status >= 500) return 'server';
    return 'client';
  }
  return 'transport';
}
