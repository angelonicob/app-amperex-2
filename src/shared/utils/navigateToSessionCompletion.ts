import {
  getPaymentSummary,
  type PaymentSummary,
} from '../../modules/session/pendingPayment';
import { usePendingPaymentStore } from '../../modules/session/store/usePendingPaymentStore';
import { navigationRef } from '../../presentation/routes/navigationRef';

function summaryRequiresPayment(summary: PaymentSummary): boolean {
  if (summary.requiresPayment === false) return false;
  if (summary.requiresPayment === true) return true;
  return Math.round(summary.amountClp) > 0;
}

export async function navigateToSessionCompletion(
  sessionId: string,
  prefetched?: PaymentSummary,
): Promise<void> {
  const summary =
    prefetched ?? (await getPaymentSummary(sessionId));
  usePendingPaymentStore.getState().setContext(summary);
  if (!navigationRef.isReady()) return;

  if (summaryRequiresPayment(summary)) {
    navigationRef.navigate('Session', { screen: 'Pago' });
  } else {
    navigationRef.navigate('Session', { screen: 'Resumen' });
  }
}

