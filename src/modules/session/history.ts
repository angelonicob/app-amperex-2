import { api } from '../../infrastructure/http/Api';

export type SessionHistoryPaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface SessionHistoryPayment {
  id?: string;
  amount: string | number;
  currency: string;
  status?: SessionHistoryPaymentStatus;
}

export interface SessionHistoryEvent {
  type: string;
  payload?: Record<string, unknown> | null;
}

export interface SessionHistoryItem {
  id: string;
  station?: {
    id: string;
    name: string | null;
  } | null;
  vehicle?: {
    id: string;
  } | null;
  status: 'FINISHED' | 'FAILED' | string;
  startedAt: string | null;
  endedAt: string | null;
  energyKwh?: string | number | null;
  targetPercentage?: number | null;
  payment?: SessionHistoryPayment | null;
  paymentDue?: boolean;
  events?: SessionHistoryEvent[] | null;
}

export type SessionHistoryResponse = SessionHistoryItem[];

export const getSessionHistory = async (): Promise<SessionHistoryResponse> => {
  const { data } = await api.get<SessionHistoryResponse>('session/history');
  return data;
};
