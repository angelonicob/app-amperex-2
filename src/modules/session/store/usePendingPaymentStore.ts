import { create } from 'zustand';
import type { PaymentSummary } from '../pendingPayment';

interface PendingPaymentState {
  context: PaymentSummary | null;
  setContext: (summary: PaymentSummary) => void;
  clearContext: () => void;
}

export const usePendingPaymentStore = create<PendingPaymentState>((set) => ({
  context: null,
  setContext: (summary) => set({ context: summary }),
  clearContext: () => set({ context: null }),
}));
