import { isAxiosError } from 'axios';
import { parsePaymentRequiredPayload } from '../session/pendingPayment';

export type ReservationApiErrorKind = 'payment_required' | 'forbidden' | 'other';

export type ParsedReservationApiError = {
  kind: ReservationApiErrorKind;
  message: string;
  pendingSessionId?: string;
};

export function parseReservationApiError(error: unknown): ParsedReservationApiError {
  if (!isAxiosError(error)) {
    return { kind: 'other', message: 'Ocurrió un error inesperado.' };
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 402) {
    const payment = parsePaymentRequiredPayload(data);
    if (payment) {
      return {
        kind: 'payment_required',
        message: payment.message,
        pendingSessionId: payment.pendingSessionId,
      };
    }
  }

  if (status === 403) {
    const rawMessage =
      data &&
      typeof data === 'object' &&
      'message' in data &&
      (data as { message?: unknown }).message;
    const message = Array.isArray(rawMessage)
      ? String(rawMessage[0])
      : typeof rawMessage === 'string'
        ? rawMessage
        : 'No tienes permiso para acceder a esta estación.';
    return { kind: 'forbidden', message };
  }

  const rawMessage =
    data &&
    typeof data === 'object' &&
    'message' in data &&
    (data as { message?: unknown }).message;
  const message = Array.isArray(rawMessage)
    ? String(rawMessage[0])
    : typeof rawMessage === 'string'
      ? rawMessage
      : 'No se pudo completar la operación.';
  return { kind: 'other', message };
}
