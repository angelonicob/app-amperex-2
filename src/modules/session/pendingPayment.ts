import { api } from '../../infrastructure/http/Api';

export type PaymentStatusValue = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface PendingPaymentSession {
  sessionId: string;
  amountClp: number;
  currency: string;
  status: PaymentStatusValue;
  stationName: string | null;
  endedAt: string | null;
  energyKwh: number;
}

export interface PendingPaymentsResponse {
  hasDebt: boolean;
  oldest: PendingPaymentSession | null;
  sessions: PendingPaymentSession[];
}

export interface PaymentSummary {
  sessionId: string;
  amountClp: number;
  currency: string;
  energyKwh: number;
  priceClpPerKwh: number | null;
  totalDurationSeconds: number | null;
  stationName: string | null;
  paymentStatus: PaymentStatusValue;
  /** false cuando no aplica cobro One Click (estación privada o sin energía). */
  requiresPayment?: boolean;
  /** Motivo sin cobro cuando requiresPayment es false. */
  noPaymentReason?: 'ZERO_ENERGY' | 'PRIVATE_STATION';
}

export async function getPendingPayments(): Promise<PendingPaymentsResponse> {
  const { data } = await api.get<PendingPaymentsResponse>('payments/pending');
  return data;
}

export async function getPaymentSummary(
  sessionId: string,
): Promise<PaymentSummary> {
  const { data } = await api.get<PaymentSummary>(
    `payments/${encodeURIComponent(sessionId)}/summary`,
  );
  return data;
}

export function parsePaymentRequiredPayload(data: unknown): {
  pendingSessionId: string;
  amountClp: number;
  message: string;
} | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const pendingSessionId =
    typeof d.pendingSessionId === 'string' ? d.pendingSessionId : null;
  const amountClp =
    typeof d.amountClp === 'number'
      ? d.amountClp
      : typeof d.amountClp === 'string'
        ? Number(d.amountClp)
        : NaN;
  const message =
    typeof d.message === 'string' && d.message.trim()
      ? d.message.trim()
      : 'Tienes una carga pendiente de pago.';
  if (!pendingSessionId || !Number.isFinite(amountClp)) return null;
  return { pendingSessionId, amountClp, message };
}
