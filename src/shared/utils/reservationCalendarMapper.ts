import type { UnavailableHourProps } from '@howljs/calendar-kit';
import type { EventItem } from '@howljs/calendar-kit';
import type { ConnectorAgendaResponse } from '../../modules/reservation/types';
import {
  buildReservationWindowContext,
  minutes24ToLocalIso,
  type ReservationWindowMinutes,
} from './connectorSchedule';
import { parseHhMmToMinutes24 } from './departureTime';

export const DRAFT_RESERVATION_EVENT_ID = 'draft-reservation';
export const OCCUPIED_EVENT_ID_PREFIX = 'occupied-';

export interface OccupiedEventColors {
  color: string;
  titleColor: string;
  title: string;
}

/** Colores de bloques ocupados con contraste legible (especialmente en tema oscuro). */
export function resolveOccupiedEventColors(
  occ: { userId: string; source?: 'reservation' | 'session' },
  options: { currentUserId?: string | null; isDark: boolean },
): OccupiedEventColors {
  const isMine =
    options.currentUserId != null && occ.userId === options.currentUserId;
  const isSession = occ.source === 'session';

  if (isMine) {
    return {
      color: options.isDark ? '#2E8A57' : 'rgba(68, 183, 120, 0.52)',
      titleColor: '#FFFFFF',
      title: isSession ? 'Tu carga' : 'Tu reserva',
    };
  }

  if (isSession) {
    return {
      color: options.isDark ? '#B8860B' : 'rgba(255, 170, 0, 0.55)',
      titleColor: '#FFFFFF',
      title: 'En carga',
    };
  }

  return {
    color: options.isDark ? '#C9365A' : 'rgba(255, 61, 113, 0.52)',
    titleColor: '#FFFFFF',
    title: 'Ocupado',
  };
}

function toCalendarDateTime(localIso: string, timeZone: string): EventItem['start'] {
  const d = new Date(localIso.replace('T', ' ') + ':00');
  return {
    dateTime: d.toISOString(),
    timeZone,
  };
}

export function mapOccupiedEvents(
  agenda: ConnectorAgendaResponse,
  options: {
    dateKey: string;
    timeZone: string;
    currentUserId?: string | null;
    isDark?: boolean;
  },
): EventItem[] {
  const occupancies =
    agenda.activeOccupancies ??
    [
      ...(agenda.activeReservations ?? []).map((r) => ({
        ...r,
        id: r.startAt,
        source: 'reservation' as const,
      })),
      ...(agenda.activeSessions ?? []),
    ];

  const isDark = options.isDark ?? false;

  return occupancies.map((occ) => {
    const styling = resolveOccupiedEventColors(occ, {
      currentUserId: options.currentUserId,
      isDark,
    });
    const startLocal = new Date(occ.startAt);
    const blockEndLocal = new Date(occ.agendaBlockUntil);
    const startIso = `${options.dateKey}T${String(startLocal.getHours()).padStart(2, '0')}:${String(startLocal.getMinutes()).padStart(2, '0')}`;
    const endIso = `${options.dateKey}T${String(blockEndLocal.getHours()).padStart(2, '0')}:${String(blockEndLocal.getMinutes()).padStart(2, '0')}`;

    return {
      id: `${OCCUPIED_EVENT_ID_PREFIX}${occ.id ?? occ.startAt}`,
      title: styling.title,
      start: toCalendarDateTime(startIso, options.timeZone),
      end: toCalendarDateTime(endIso, options.timeZone),
      color: styling.color,
      titleColor: styling.titleColor,
    };
  });
}

export function mapDraftReservationEvent(
  window: ReservationWindowMinutes,
  dateKey: string,
  timeZone: string,
  primaryColor: string,
): EventItem {
  const startIso = minutes24ToLocalIso(dateKey, window.startMinutes24);
  const endIso = minutes24ToLocalIso(dateKey, window.endMinutes24);
  return {
    id: DRAFT_RESERVATION_EVENT_ID,
    title: 'Tu reserva',
    start: toCalendarDateTime(startIso, timeZone),
    end: toCalendarDateTime(endIso, timeZone),
    color: primaryColor,
    titleColor: '#FFFFFF',
  };
}

export function buildUnavailableHoursForDate(
  agenda: ConnectorAgendaResponse,
  dateKey: string,
  now: Date,
): UnavailableHourProps[] {
  const ctx = buildReservationWindowContext(agenda, { dateKey, now });
  const openMinutes =
    parseHhMmToMinutes24(agenda.station.openAt) ?? ctx.stationWindow.openMinutes24;
  const closeMinutes =
    parseHhMmToMinutes24(agenda.station.closeAt) ?? ctx.stationWindow.closeMinutes24;

  const ranges: UnavailableHourProps[] = [];

  if (openMinutes > 0) {
    ranges.push({ start: 0, end: openMinutes });
  }
  if (closeMinutes < 24 * 60) {
    ranges.push({ start: closeMinutes, end: 24 * 60 });
  }

  const earliest = ctx.earliestBookableMinutes24;
  if (earliest > openMinutes) {
    ranges.push({ start: openMinutes, end: earliest });
  }

  return ranges;
}

export function buildUnavailableHoursByDate(
  agenda: ConnectorAgendaResponse,
  dateKey: string,
  now: Date,
): Record<string, UnavailableHourProps[]> {
  return {
    [dateKey]: buildUnavailableHoursForDate(agenda, dateKey, now),
  };
}

export function resolveEventLocalDateKey(
  event: Pick<EventItem, 'start'>,
): string | null {
  const startDt = event.start?.dateTime;
  if (!startDt) return null;
  const start = new Date(startDt);
  const y = start.getFullYear();
  const mo = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/** Redondea minutos al inicio del bloque de agenda (p. ej. 30 min). */
export function snapMinutes24ToSlot(
  minutes24: number,
  slotMinutes: number,
): number {
  return Math.floor(minutes24 / slotMinutes) * slotMinutes;
}

/** Ventana de reserva mínima al tocar un bloque horario. */
export function windowFromTapDateTime(
  dateTimeIso: string,
  slotMinutes: number,
): ReservationWindowMinutes {
  const d = new Date(dateTimeIso);
  const startMinutes24 = snapMinutes24ToSlot(
    d.getHours() * 60 + d.getMinutes(),
    slotMinutes,
  );
  return {
    startMinutes24,
    endMinutes24: startMinutes24 + slotMinutes,
  };
}

export function calendarEventToWindowMinutes(
  event: Pick<EventItem, 'start' | 'end'>,
  dateKey: string,
): ReservationWindowMinutes | null {
  const startDt = event.start.dateTime;
  const endDt = event.end.dateTime;
  if (!startDt || !endDt) return null;

  const startKey = resolveEventLocalDateKey(event);
  if (!startKey || startKey !== dateKey) return null;

  const start = new Date(startDt);
  const end = new Date(endDt);

  return {
    startMinutes24: start.getHours() * 60 + start.getMinutes(),
    endMinutes24: end.getHours() * 60 + end.getMinutes(),
  };
}

export function windowMinutesToSelectedEvent(
  window: ReservationWindowMinutes,
  dateKey: string,
  timeZone: string,
  primaryColor: string,
): EventItem {
  return mapDraftReservationEvent(window, dateKey, timeZone, primaryColor);
}
