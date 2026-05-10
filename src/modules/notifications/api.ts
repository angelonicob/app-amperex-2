import { api, API_URL } from '../../infrastructure/http/Api';
import type { NotificationsListResponse, Notification } from './types';

const API_BASE = API_URL.replace(/\/mobile\/?$/, '');

export async function registerPushToken(
  expoPushToken: string,
  platform?: string,
): Promise<void> {
  await api.post('notifications/token', {
    expoPushToken,
    platform: platform ?? (require('react-native').Platform.OS as string),
  });
}

type NotificationsBackendList = {
  data: Notification[];
  total?: number;
  meta?: { total?: number };
};

export async function getNotifications(params?: {
  limit?: number;
  offset?: number;
}): Promise<NotificationsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.offset != null) searchParams.set('offset', String(params.offset));
  const q = searchParams.toString();
  const url = `${API_BASE}/notifications${q ? `?${q}` : ''}`;
  const { data: body } = await api.get<NotificationsBackendList>(url);
  const list = body?.data ?? [];
  const total = body?.total ?? body?.meta?.total ?? list.length;
  return { data: list, total };
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const url = `${API_BASE}/notifications/${id}/read`;
  const { data } = await api.patch<{ success: boolean }>(url);
  return data?.success ?? false;
}

export async function deleteNotification(id: string): Promise<boolean> {
  const url = `${API_BASE}/notifications/${id}`;
  const { data } = await api.delete<{ success: boolean }>(url);
  return data?.success ?? false;
}

export async function deleteAllNotifications(): Promise<boolean> {
  const url = `${API_BASE}/notifications/all`;
  const { data } = await api.delete<{ success: boolean }>(url);
  return data?.success ?? false;
}
