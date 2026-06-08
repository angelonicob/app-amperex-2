import { api } from '../../infrastructure/http/Api';
import type {
  ConnectorAgendaResponse,
  CreateReservationPayload,
  ReservationDetail,
  UserReservation,
  UserReservationsResponse,
} from './types';

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santiago';
  } catch {
    return 'America/Santiago';
  }
}

export function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function utcIsoToLocalDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${min}`;
}

export function addMinutesToLocalIso(localIso: string, minutes: number): string {
  const d = new Date(localIso.replace('T', ' ') + ':00');
  d.setMinutes(d.getMinutes() + minutes);
  return utcIsoToLocalDateTime(d.toISOString());
}

export async function fetchUserReservations(
  timezone = getDeviceTimezone(),
): Promise<UserReservationsResponse> {
  const { data } = await api.get<UserReservationsResponse>('reserva', {
    params: { timezone },
  });
  return data;
}

export async function fetchConnectorAgenda(
  connectorId: string,
  date: string,
  timezone = getDeviceTimezone(),
): Promise<ConnectorAgendaResponse> {
  const { data } = await api.get<ConnectorAgendaResponse>(
    `reserva/connector/${connectorId}/agenda`,
    { params: { date, timezone } },
  );
  return data;
}

export async function createReservation(
  payload: CreateReservationPayload,
): Promise<UserReservation> {
  const { data } = await api.post<UserReservation>('reserva', payload);
  return data;
}

export async function cancelReservation(id: string): Promise<void> {
  await api.delete(`reserva/${id}`);
}

export async function fetchReservationDetail(
  id: string,
  timezone = getDeviceTimezone(),
): Promise<ReservationDetail> {
  const { data } = await api.get<ReservationDetail>(`reserva/${id}`, {
    params: { timezone },
  });
  return data;
}

export async function confirmReservation(id: string): Promise<void> {
  await api.post(`reserva/${id}/confirm`);
}
