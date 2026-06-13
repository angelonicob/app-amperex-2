import type { PaymentSummary } from '../../modules/session/pendingPayment';

export type NoPaymentReason = 'ZERO_ENERGY' | 'PRIVATE_STATION';

export function resolveNoPaymentReasonFromSummary(
  summary: Pick<PaymentSummary, 'noPaymentReason' | 'energyKwh' | 'amountClp'>,
): NoPaymentReason {
  if (summary.noPaymentReason) return summary.noPaymentReason;
  const energy = Number(summary.energyKwh) || 0;
  if (energy <= 0) return 'ZERO_ENERGY';
  return 'PRIVATE_STATION';
}

export function buildSessionCompletionSubtitle(
  summary: Pick<
    PaymentSummary,
    'stationName' | 'noPaymentReason' | 'energyKwh' | 'amountClp'
  >,
): string {
  const station = summary.stationName?.trim();
  const prefix = station ? `${station} · ` : '';
  const reason = resolveNoPaymentReasonFromSummary(summary);

  if (reason === 'ZERO_ENERGY') {
    return (
      `${prefix}No se entregó energía durante la sesión, por lo que no hay cobro.`
    ).trim();
  }

  return station
    ? `${station} · Estación privada, sin cobro`
    : 'Estación privada — sin cobro al usuario';
}
