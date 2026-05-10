import { api, API_URL } from '../../infrastructure/http/Api';

const PAYMENTS_BASE = '../payments/oneclick';

export interface OneClickStartInscriptionResponse {
  token: string;
  url_webpay: string;
}

export interface OneClickInscriptionStatusResponse {
  enrolled: boolean;
  cardLast4?: string;
  cardType?: string;
}

export interface OneClickCard {
  id: string;
  displayName: string | null;
  cardLast4: string | null;
  cardType: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface OneClickCardsResponse {
  cards: OneClickCard[];
}

export interface OneClickAuthorizeResponse {
  success: boolean;
  payment?: {
    id: string;
    externalPaymentId: string;
    amount: number;
    paymentMethod: string;
    status: string;
  };
}

export interface OneClickDeleteInscriptionResponse {
  ok: boolean;
}

export const startInscription = async (
  email?: string,
): Promise<OneClickStartInscriptionResponse> => {
  const { data } = await api.post<OneClickStartInscriptionResponse>(
    `${PAYMENTS_BASE}/inscription/start`,
    email != null ? { email } : {},
  );
  return data;
};

export const getInscriptionStatus =
  async (): Promise<OneClickInscriptionStatusResponse> => {
    const { data } = await api.get<OneClickInscriptionStatusResponse>(
      `${PAYMENTS_BASE}/inscription`,
    );
    return data;
  };

export const authorizePayment = async (
  sessionId: string,
  cardId?: string,
): Promise<OneClickAuthorizeResponse> => {
  const { data } = await api.post<OneClickAuthorizeResponse>(
    `${PAYMENTS_BASE}/authorize`,
    cardId ? { sessionId, cardId } : { sessionId },
  );
  return data;
};

export const deleteInscription =
  async (): Promise<OneClickDeleteInscriptionResponse> => {
    const { data } = await api.delete<OneClickDeleteInscriptionResponse>(
      `${PAYMENTS_BASE}/inscription`,
    );
    return data;
  };

// --- Cards (multi-card management) ---

export const getCards = async (): Promise<OneClickCardsResponse> => {
  const { data } = await api.get<OneClickCardsResponse>(`${PAYMENTS_BASE}/cards`);
  return data;
};

export const updateCardName = async (
  cardId: string,
  displayName: string,
): Promise<{ ok: boolean }> => {
  const { data } = await api.patch<{ ok: boolean }>(
    `${PAYMENTS_BASE}/cards/${encodeURIComponent(cardId)}`,
    { displayName },
  );
  return data;
};

export const setDefaultCard = async (cardId: string): Promise<{ ok: boolean }> => {
  const { data } = await api.post<{ ok: boolean }>(
    `${PAYMENTS_BASE}/cards/${encodeURIComponent(cardId)}/default`,
    {},
  );
  return data;
};

export const deleteCard = async (cardId: string): Promise<{ ok: boolean }> => {
  const { data } = await api.delete<{ ok: boolean }>(
    `${PAYMENTS_BASE}/cards/${encodeURIComponent(cardId)}`,
  );
  return data;
};

/** URL del backend para abrir el flujo de inscripción (redirect con token). */
export const getInscriptionRedirectUrl = (token: string): string => {
  const base = API_URL.replace(/\/mobile\/?$/, '').replace(/\/$/, '');
  return `${base}/payments/oneclick/inscription/redirect?token=${encodeURIComponent(token)}`;
};
