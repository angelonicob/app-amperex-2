import { api } from '../../infrastructure/http/Api';

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
  energyKwh?: string | null;
}

export type SessionHistoryResponse = SessionHistoryItem[];

export const getSessionHistory = async (): Promise<SessionHistoryResponse> => {
  const { data } = await api.get<SessionHistoryResponse>('session/history');
  return data;
};

