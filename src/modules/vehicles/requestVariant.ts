import { api, API_URL } from '../../infrastructure/http/Api';

const API_BASE = API_URL.replace(/\/mobile\/?$/, '');

export interface CreateVariantRequestInput {
  brand: string;
  model: string;
  variant?: string;
  yearFrom?: number;
  yearTo?: number;
  notes?: string;
}

export interface CreateVariantRequestResponse {
  success: boolean;
  requestId: string;
}

export async function createVariantRequest(
  body: CreateVariantRequestInput,
): Promise<CreateVariantRequestResponse> {
  const { data } = await api.post<CreateVariantRequestResponse>(
    `${API_BASE}/mobile/car/variant-requests`,
    body,
  );
  return data;
}
