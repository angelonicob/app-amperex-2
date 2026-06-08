import type { TimePickerColumnsValue } from '../components/session/TimePickerColumns';
import type {
  AgendaActiveReservation,
  AgendaActiveOccupancy,
  ConnectorAgendaResponse,
} from '../../modules/reservation/types';
import {
  type DepartureTimeBounds,
  type StationHoursWindow,
  formatMinutes24AsHhMm,
  formatTimePickerValue,
  getNowMinutes24,
  hasSelectableDepartureSlot,
  minutes24ToTimePickerValue,
  parseHhMmToMinutes24,
  parseIsoLocalToMinutes24,
  resolveStationHoursWindow,
  timePickerValueToMinutes24,
} from './departureTime';

export type ScheduleMode = 'reservation' | 'session';

/** Fallback si la API no devuelve grace (alinear con backend .env). */
export const DEFAULT_LATE_DEPARTURE_GRACE_MINUTES = 10;
export const DEFAULT_MIN_RESERVATION_MINUTES = 30;

export interface ProgrammedReservationWindow {
  startAtLocal?: string;
  endAtLocal?: string;
}

export interface ScheduleContextOptions {
  mode: ScheduleMode;
  dateKey: string;
  fixedStartAtUtc?: string;
  programmedReservation?: ProgrammedReservationWindow | null;
  currentUserId?: string | null;
  now?: Date;
}

export interface EndTimeScheduleContext {
  mode: ScheduleMode;
  dateKey: string;
  stationWindow: StationHoursWindow;
  graceMinutes: number;
  minReservationMinutes: number;
  fixedStartMs: number;
  fixedStartMinutes24: number;
  activeReservations: AgendaActiveReservation[];
  programmedReservation?: ProgrammedReservationWindow | null;
  nowMinutes24: number;
}

export interface EndTimeLimitHint {
  /** Siguiente bloque ajeno que acota la salida (ISO UTC inicio). */
  nextBlockingStartAt?: string;
  nextBlockingStartMinutes24?: number;
}

function rangesOverlapMs(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function minutes24OnDateKey(dateKey: string, minutes24: number): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  const h = Math.floor(minutes24 / 60);
  const min = minutes24 % 60;
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function dateKeyFromUtcIso(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function utcIsoToMinutes24OnLocalDate(iso: string, dateKey: string): number {
  const d = new Date(iso);
  const localKey = dateKeyFromUtcIso(iso);
  if (localKey !== dateKey) {
    return d.getHours() * 60 + d.getMinutes();
  }
  return d.getHours() * 60 + d.getMinutes();
}

function mergeAgendaActiveBlocks(
  agenda: ConnectorAgendaResponse,
): AgendaActiveReservation[] {
  if (agenda.activeOccupancies?.length) {
    return agenda.activeOccupancies.map(({ userId, startAt, endAt, agendaBlockUntil }) => ({
      userId,
      startAt,
      endAt,
      agendaBlockUntil,
    }));
  }
  const reservations = agenda.activeReservations ?? [];
  const sessions = (agenda.activeSessions ?? []).map(
    (s: AgendaActiveOccupancy) => ({
      userId: s.userId,
      startAt: s.startAt,
      endAt: s.endAt,
      agendaBlockUntil: s.agendaBlockUntil,
    }),
  );
  return [...reservations, ...sessions];
}

export function buildEndTimeScheduleContext(
  agenda: ConnectorAgendaResponse,
  options: ScheduleContextOptions,
): EndTimeScheduleContext {
  const now = options.now ?? new Date();
  const nowMinutes24 = getNowMinutes24(now);
  const graceMinutes =
    agenda.lateDepartureGraceMinutes ?? DEFAULT_LATE_DEPARTURE_GRACE_MINUTES;
  const minReservationMinutes =
    agenda.minReservationMinutes ?? DEFAULT_MIN_RESERVATION_MINUTES;

  let fixedStartMs: number;
  if (options.mode === 'reservation' && options.fixedStartAtUtc) {
    fixedStartMs = new Date(options.fixedStartAtUtc).getTime();
  } else {
    fixedStartMs = now.getTime();
  }

  const fixedStartDate = new Date(fixedStartMs);
  const fixedStartMinutes24 =
    options.dateKey === dateKeyFromUtcIso(fixedStartDate.toISOString())
      ? fixedStartDate.getHours() * 60 + fixedStartDate.getMinutes()
      : nowMinutes24;

  return {
    mode: options.mode,
    dateKey: options.dateKey,
    stationWindow: resolveStationHoursWindow(
      agenda.station.openAt,
      agenda.station.closeAt,
    ),
    graceMinutes,
    minReservationMinutes,
    fixedStartMs,
    fixedStartMinutes24,
    activeReservations: mergeAgendaActiveBlocks(agenda),
    programmedReservation: options.programmedReservation,
    nowMinutes24,
  };
}

function getOtherActiveReservations(
  ctx: EndTimeScheduleContext,
  currentUserId?: string | null,
): AgendaActiveReservation[] {
  return ctx.activeReservations.filter((r) => {
    if (currentUserId && r.userId === currentUserId) return false;
    return true;
  });
}

function endMsWithGrace(ctx: EndTimeScheduleContext, endMinutes24: number): number {
  const end = minutes24OnDateKey(ctx.dateKey, endMinutes24).getTime();
  return end + ctx.graceMinutes * 60 * 1000;
}

function overlapsOtherReservation(
  ctx: EndTimeScheduleContext,
  endMinutes24: number,
  currentUserId?: string | null,
): boolean {
  const blockStart = ctx.fixedStartMs;
  const blockEnd = endMsWithGrace(ctx, endMinutes24);
  for (const r of getOtherActiveReservations(ctx, currentUserId)) {
    const rStart = new Date(r.startAt).getTime();
    const rEnd = new Date(r.agendaBlockUntil).getTime();
    if (rangesOverlapMs(blockStart, blockEnd, rStart, rEnd)) {
      return true;
    }
  }
  return false;
}

function findLimitingNextReservation(
  ctx: EndTimeScheduleContext,
  maxMinutes24: number,
  currentUserId?: string | null,
): EndTimeLimitHint | null {
  let best: { startMs: number; startMin: number } | null = null;
  for (const r of getOtherActiveReservations(ctx, currentUserId)) {
    const rStartMs = new Date(r.startAt).getTime();
    const rStartMin = utcIsoToMinutes24OnLocalDate(r.startAt, ctx.dateKey);
    if (rStartMin > maxMinutes24) continue;
    const latestDepartureMin = rStartMin - ctx.graceMinutes;
    if (latestDepartureMin < ctx.stationWindow.openMinutes24) continue;
    if (!best || rStartMs < best.startMs) {
      best = { startMs: rStartMs, startMin: rStartMin };
    }
  }
  if (!best) return null;
  return {
    nextBlockingStartAt: new Date(best.startMs).toISOString(),
    nextBlockingStartMinutes24: best.startMin,
  };
}

export interface EndTimeBoundsResult extends DepartureTimeBounds {
  limitHint: EndTimeLimitHint | null;
}

export function getEndTimeBounds(
  ctx: EndTimeScheduleContext,
  currentUserId?: string | null,
): EndTimeBoundsResult {
  const { stationWindow, graceMinutes, minReservationMinutes } = ctx;

  let minMinutes24 =
    ctx.mode === 'reservation'
      ? ctx.fixedStartMinutes24 + minReservationMinutes
      : Math.max(ctx.nowMinutes24 + 1, stationWindow.openMinutes24);

  if (ctx.mode === 'session') {
    minMinutes24 = Math.max(minMinutes24, ctx.nowMinutes24 + 1, stationWindow.openMinutes24);
  } else {
    minMinutes24 = Math.max(minMinutes24, stationWindow.openMinutes24);
  }

  let maxMinutes24 = stationWindow.closeMinutes24;

  const programmedEnd = ctx.programmedReservation?.endAtLocal
    ? parseIsoLocalToMinutes24(ctx.programmedReservation.endAtLocal)
    : null;
  if (programmedEnd != null && Number.isFinite(programmedEnd)) {
    maxMinutes24 = Math.min(maxMinutes24, programmedEnd);
  }

  let limitHint: EndTimeLimitHint | null = null;
  for (const r of getOtherActiveReservations(ctx, currentUserId)) {
    const rStartMin = utcIsoToMinutes24OnLocalDate(r.startAt, ctx.dateKey);
    const cap = rStartMin - graceMinutes;
    if (cap < maxMinutes24) {
      maxMinutes24 = cap;
      limitHint = {
        nextBlockingStartAt: r.startAt,
        nextBlockingStartMinutes24: rStartMin,
      };
    }
  }

  if (maxMinutes24 < minMinutes24) {
    return {
      minMinutes24,
      maxMinutes24,
      limitHint,
    };
  }

  const refinedHint = findLimitingNextReservation(
    ctx,
    maxMinutes24,
    currentUserId,
  );
  if (refinedHint) {
    limitHint = refinedHint;
  }

  return { minMinutes24, maxMinutes24, limitHint };
}

export function isEndTimeMinutes24Valid(
  minutes24: number,
  ctx: EndTimeScheduleContext,
  bounds: DepartureTimeBounds,
  currentUserId?: string | null,
): boolean {
  if (!hasSelectableDepartureSlot(bounds)) return false;
  if (minutes24 < bounds.minMinutes24 || minutes24 > bounds.maxMinutes24) {
    return false;
  }
  if (minutes24 <= ctx.nowMinutes24 && ctx.mode === 'session') {
    return false;
  }
  return !overlapsOtherReservation(ctx, minutes24, currentUserId);
}

export function isEndTimePickerValueValid(
  value: TimePickerColumnsValue,
  ctx: EndTimeScheduleContext,
  bounds: DepartureTimeBounds,
  currentUserId?: string | null,
): boolean {
  return isEndTimeMinutes24Valid(
    timePickerValueToMinutes24(value),
    ctx,
    bounds,
    currentUserId,
  );
}

export function isEndTimePickerOptionValid(
  hour: number,
  minute: number,
  ampm: 'AM' | 'PM',
  ctx: EndTimeScheduleContext,
  bounds: DepartureTimeBounds,
  currentUserId?: string | null,
): boolean {
  return isEndTimeMinutes24Valid(
    timePickerValueToMinutes24({ hour, minute, ampm }),
    ctx,
    bounds,
    currentUserId,
  );
}

export function getDefaultEndTime(
  bounds: DepartureTimeBounds,
): TimePickerColumnsValue {
  if (!hasSelectableDepartureSlot(bounds)) {
    return minutes24ToTimePickerValue(getNowMinutes24());
  }
  return minutes24ToTimePickerValue(bounds.minMinutes24);
}

export function clampEndTime(
  value: TimePickerColumnsValue,
  ctx: EndTimeScheduleContext,
  bounds: DepartureTimeBounds,
  currentUserId?: string | null,
): TimePickerColumnsValue {
  if (!hasSelectableDepartureSlot(bounds)) return value;
  let m = timePickerValueToMinutes24(value);
  m = Math.max(bounds.minMinutes24, Math.min(bounds.maxMinutes24, m));
  if (isEndTimeMinutes24Valid(m, ctx, bounds, currentUserId)) {
    return minutes24ToTimePickerValue(m);
  }
  for (let candidate = m; candidate >= bounds.minMinutes24; candidate--) {
    if (isEndTimeMinutes24Valid(candidate, ctx, bounds, currentUserId)) {
      return minutes24ToTimePickerValue(candidate);
    }
  }
  for (let candidate = bounds.minMinutes24; candidate <= bounds.maxMinutes24; candidate++) {
    if (isEndTimeMinutes24Valid(candidate, ctx, bounds, currentUserId)) {
      return minutes24ToTimePickerValue(candidate);
    }
  }
  return minutes24ToTimePickerValue(bounds.minMinutes24);
}

export function resolveEndTimeForStep(
  prev: TimePickerColumnsValue | null,
  ctx: EndTimeScheduleContext,
  currentUserId?: string | null,
): TimePickerColumnsValue {
  const bounds = getEndTimeBounds(ctx, currentUserId);
  if (prev != null && isEndTimePickerValueValid(prev, ctx, bounds, currentUserId)) {
    return prev;
  }
  if (prev != null && hasSelectableDepartureSlot(bounds)) {
    return clampEndTime(prev, ctx, bounds, currentUserId);
  }
  return getDefaultEndTime(bounds);
}

export function validateEndTime(
  value: TimePickerColumnsValue,
  ctx: EndTimeScheduleContext,
  currentUserId?: string | null,
): string | null {
  const bounds = getEndTimeBounds(ctx, currentUserId);
  const { stationWindow } = ctx;
  if (!hasSelectableDepartureSlot(bounds)) {
    return `No hay horarios de salida disponibles hoy. La estación cierra a las ${stationWindow.closeAt}.`;
  }
  const minutes24 = timePickerValueToMinutes24(value);
  if (ctx.mode === 'session' && minutes24 <= ctx.nowMinutes24) {
    return 'El horario de salida debe ser posterior a la hora actual.';
  }
  if (minutes24 > stationWindow.closeMinutes24) {
    return `El horario de salida no puede ser después del cierre de la estación (${stationWindow.closeAt}).`;
  }
  if (minutes24 < bounds.minMinutes24) {
    if (ctx.mode === 'reservation') {
      return `La salida debe ser al menos ${ctx.minReservationMinutes} minutos después del inicio.`;
    }
    return 'El horario de salida debe ser posterior a la hora actual.';
  }
  if (minutes24 > bounds.maxMinutes24) {
    const fullBounds = getEndTimeBounds(ctx, currentUserId);
    const msg = formatLimitHintMessage(fullBounds, ctx.graceMinutes);
    if (msg) return msg;
    return 'El horario seleccionado no está dentro del rango permitido.';
  }
  if (overlapsOtherReservation(ctx, minutes24, currentUserId)) {
    return 'Ese horario se solapa con otra reserva o sesión de carga en el conector (incluye margen de desconexión).';
  }
  return null;
}

export function formatEndTimeRangeLabel(bounds: DepartureTimeBounds): string {
  if (!hasSelectableDepartureSlot(bounds)) {
    return 'Sin horarios disponibles por hoy';
  }
  return `${formatMinutes24AsHhMm(bounds.minMinutes24)} – ${formatMinutes24AsHhMm(bounds.maxMinutes24)}`;
}

export function formatEndTimeSummary(
  value: TimePickerColumnsValue,
  ctx: EndTimeScheduleContext,
): { departureLabel: string; connectorFreeFromLabel: string } {
  const minutes24 = timePickerValueToMinutes24(value);
  const freeFromMinutes = Math.min(
    23 * 60 + 59,
    minutes24 + ctx.graceMinutes,
  );
  return {
    departureLabel: formatTimePickerValue(value),
    connectorFreeFromLabel: formatMinutes24AsHhMm(freeFromMinutes),
  };
}

export function formatLimitHintMessage(
  bounds: EndTimeBoundsResult,
  graceMinutes: number,
): string | null {
  const hint = bounds.limitHint;
  if (hint?.nextBlockingStartMinutes24 == null) return null;
  const lastDeparture = bounds.maxMinutes24;
  return `Próxima reserva a las ${formatMinutes24AsHhMm(hint.nextBlockingStartMinutes24)}. Última salida: ${formatMinutes24AsHhMm(lastDeparture)} (margen de ${graceMinutes} min).`;
}

export function endTimeToLocalIso(
  value: TimePickerColumnsValue,
  dateKey: string,
): string {
  return minutes24ToLocalIso(dateKey, timePickerValueToMinutes24(value));
}

export const RESERVATION_DRAG_STEP_MINUTES = 5;

export interface ReservationWindowMinutes {
  startMinutes24: number;
  endMinutes24: number;
}

export interface ReservationWindowContext {
  dateKey: string;
  stationWindow: StationHoursWindow;
  graceMinutes: number;
  minReservationMinutes: number;
  activeReservations: AgendaActiveReservation[];
  nowMinutes24: number;
  earliestBookableMinutes24: number;
}

export interface StartTimeBoundsResult extends DepartureTimeBounds {
  limitHint?: { previousBlockEndMinutes24?: number };
}

function getOtherActiveFromWindowCtx(
  ctx: ReservationWindowContext,
  currentUserId?: string | null,
): AgendaActiveReservation[] {
  return ctx.activeReservations.filter((r) => {
    if (currentUserId && r.userId === currentUserId) return false;
    return true;
  });
}

export function getEarliestBookableMinutes24(
  agenda: ConnectorAgendaResponse,
  dateKey: string,
  stationWindow: StationHoursWindow,
  now: Date,
): number {
  const todayKey = dateKeyFromUtcIso(now.toISOString());
  if (dateKey < todayKey) return stationWindow.closeMinutes24;
  if (dateKey > todayKey) return stationWindow.openMinutes24;

  const minReservationMinutes =
    agenda.minReservationMinutes ?? DEFAULT_MIN_RESERVATION_MINUTES;
  const lastStart = stationWindow.closeMinutes24 - minReservationMinutes;
  const noSlotsToday = () => stationWindow.closeMinutes24;

  const advanceHours = agenda.minAdvanceHours ?? 2;
  const nowMin = getNowMinutes24(now);
  const advanceMin = nowMin + advanceHours * 60;

  if (advanceMin >= 24 * 60) {
    return noSlotsToday();
  }

  let earliest = Math.max(stationWindow.openMinutes24, advanceMin);

  if (agenda.earliestBookableUtc) {
    const ebKey = dateKeyFromUtcIso(agenda.earliestBookableUtc);
    if (ebKey > dateKey) {
      return noSlotsToday();
    }
    if (ebKey === dateKey) {
      const eb = new Date(agenda.earliestBookableUtc);
      earliest = Math.max(earliest, eb.getHours() * 60 + eb.getMinutes());
    }
  }

  if (earliest > lastStart) {
    return noSlotsToday();
  }

  return earliest;
}

export function buildReservationWindowContext(
  agenda: ConnectorAgendaResponse,
  options: { dateKey: string; now?: Date },
): ReservationWindowContext {
  const now = options.now ?? new Date();
  const stationWindow = resolveStationHoursWindow(
    agenda.station.openAt,
    agenda.station.closeAt,
  );
  return {
    dateKey: options.dateKey,
    stationWindow,
    graceMinutes:
      agenda.lateDepartureGraceMinutes ?? DEFAULT_LATE_DEPARTURE_GRACE_MINUTES,
    minReservationMinutes:
      agenda.minReservationMinutes ?? DEFAULT_MIN_RESERVATION_MINUTES,
    activeReservations: mergeAgendaActiveBlocks(agenda),
    nowMinutes24: getNowMinutes24(now),
    earliestBookableMinutes24: getEarliestBookableMinutes24(
      agenda,
      options.dateKey,
      stationWindow,
      now,
    ),
  };
}

export function minutes24ToLocalIso(
  dateKey: string,
  minutes24: number,
): string {
  const d = minutes24OnDateKey(dateKey, minutes24);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${min}`;
}

export function localIsoToMinutes24(localIso: string): number {
  const d = new Date(localIso.replace('T', ' ') + ':00');
  return d.getHours() * 60 + d.getMinutes();
}

function windowEndMsWithGrace(
  ctx: ReservationWindowContext,
  endMinutes24: number,
): number {
  return (
    minutes24OnDateKey(ctx.dateKey, endMinutes24).getTime() +
    ctx.graceMinutes * 60 * 1000
  );
}

export function windowOverlapsOther(
  ctx: ReservationWindowContext,
  startMinutes24: number,
  endMinutes24: number,
  currentUserId?: string | null,
): boolean {
  const blockStart = minutes24OnDateKey(ctx.dateKey, startMinutes24).getTime();
  const blockEnd = windowEndMsWithGrace(ctx, endMinutes24);
  for (const r of getOtherActiveFromWindowCtx(ctx, currentUserId)) {
    const rStart = new Date(r.startAt).getTime();
    const rEnd = new Date(r.agendaBlockUntil).getTime();
    if (rangesOverlapMs(blockStart, blockEnd, rStart, rEnd)) {
      return true;
    }
  }
  return false;
}

export function getStartTimeBounds(
  ctx: ReservationWindowContext,
  endMinutes24: number,
  currentUserId?: string | null,
): StartTimeBoundsResult {
  const { stationWindow, minReservationMinutes } = ctx;
  let minMinutes24 = Math.max(
    stationWindow.openMinutes24,
    ctx.earliestBookableMinutes24,
  );
  let maxMinutes24 = endMinutes24 - minReservationMinutes;
  let limitHint: StartTimeBoundsResult['limitHint'];

  const endWithGraceMs = windowEndMsWithGrace(ctx, endMinutes24);
  for (const r of getOtherActiveFromWindowCtx(ctx, currentUserId)) {
    const rStartMs = new Date(r.startAt).getTime();
    const rBlockEndMin = utcIsoToMinutes24OnLocalDate(
      r.agendaBlockUntil,
      ctx.dateKey,
    );
    if (endWithGraceMs > rStartMs) {
      if (rBlockEndMin > minMinutes24) {
        minMinutes24 = rBlockEndMin;
        limitHint = { previousBlockEndMinutes24: rBlockEndMin };
      }
    }
  }

  return { minMinutes24, maxMinutes24, limitHint };
}

export function getEndTimeBoundsForWindow(
  agenda: ConnectorAgendaResponse,
  options: {
    dateKey: string;
    startMinutes24: number;
    currentUserId?: string | null;
    now?: Date;
  },
): EndTimeBoundsResult {
  const fixedStartAtUtc = minutes24OnDateKey(
    options.dateKey,
    options.startMinutes24,
  ).toISOString();
  const ctx = buildEndTimeScheduleContext(agenda, {
    mode: 'reservation',
    dateKey: options.dateKey,
    fixedStartAtUtc,
    now: options.now,
  });
  return getEndTimeBounds(ctx, options.currentUserId);
}

export function isReservationWindowValid(
  ctx: ReservationWindowContext,
  window: ReservationWindowMinutes,
  currentUserId?: string | null,
): boolean {
  const { stationWindow, minReservationMinutes } = ctx;
  const { startMinutes24, endMinutes24 } = window;
  if (endMinutes24 - startMinutes24 < minReservationMinutes) return false;
  if (startMinutes24 < ctx.earliestBookableMinutes24) return false;
  if (
    startMinutes24 < stationWindow.openMinutes24 ||
    endMinutes24 > stationWindow.closeMinutes24
  ) {
    return false;
  }
  return !windowOverlapsOther(
    ctx,
    startMinutes24,
    endMinutes24,
    currentUserId,
  );
}

export function roundMinutes24ToStep(
  minutes24: number,
  step = RESERVATION_DRAG_STEP_MINUTES,
): number {
  return Math.round(minutes24 / step) * step;
}

export function clampReservationWindow(
  agenda: ConnectorAgendaResponse,
  window: ReservationWindowMinutes,
  options: {
    dateKey: string;
    currentUserId?: string | null;
    now?: Date;
    stepMinutes?: number;
  },
): ReservationWindowMinutes {
  const step = options.stepMinutes ?? RESERVATION_DRAG_STEP_MINUTES;
  const ctx = buildReservationWindowContext(agenda, {
    dateKey: options.dateKey,
    now: options.now,
  });
  let start = roundMinutes24ToStep(window.startMinutes24, step);
  let end = roundMinutes24ToStep(window.endMinutes24, step);

  const startBounds = getStartTimeBounds(ctx, end, options.currentUserId);
  start = Math.max(startBounds.minMinutes24, Math.min(startBounds.maxMinutes24, start));

  const endBounds = getEndTimeBoundsForWindow(agenda, {
    dateKey: options.dateKey,
    startMinutes24: start,
    currentUserId: options.currentUserId,
    now: options.now,
  });
  end = Math.max(endBounds.minMinutes24, Math.min(endBounds.maxMinutes24, end));

  start = Math.max(
    startBounds.minMinutes24,
    Math.min(startBounds.maxMinutes24, start),
  );

  if (isReservationWindowValid(ctx, { startMinutes24: start, endMinutes24: end }, options.currentUserId)) {
    return { startMinutes24: start, endMinutes24: end };
  }

  for (let candidate = start; candidate <= endBounds.maxMinutes24; candidate += step) {
    const candidateEnd = Math.max(
      candidate + ctx.minReservationMinutes,
      end,
    );
    if (
      isReservationWindowValid(
        ctx,
        { startMinutes24: candidate, endMinutes24: candidateEnd },
        options.currentUserId,
      )
    ) {
      return { startMinutes24: candidate, endMinutes24: candidateEnd };
    }
  }

  return {
    startMinutes24: Math.max(startBounds.minMinutes24, startBounds.maxMinutes24),
    endMinutes24: Math.min(
      endBounds.maxMinutes24,
      Math.max(startBounds.minMinutes24, startBounds.maxMinutes24) +
        ctx.minReservationMinutes,
    ),
  };
}

export function validateReservationWindow(
  agenda: ConnectorAgendaResponse,
  window: ReservationWindowMinutes,
  options: {
    dateKey: string;
    currentUserId?: string | null;
    now?: Date;
  },
): string | null {
  const ctx = buildReservationWindowContext(agenda, {
    dateKey: options.dateKey,
    now: options.now,
  });
  const { stationWindow } = ctx;
  const { startMinutes24, endMinutes24 } = window;

  if (endMinutes24 - startMinutes24 < ctx.minReservationMinutes) {
    return `La reserva debe durar al menos ${ctx.minReservationMinutes} minutos.`;
  }
  if (startMinutes24 < ctx.earliestBookableMinutes24) {
    const advance = agenda.minAdvanceHours ?? 2;
    return `El inicio debe ser al menos ${advance} h después de ahora.`;
  }
  if (startMinutes24 < stationWindow.openMinutes24) {
    return `El inicio no puede ser antes de la apertura (${stationWindow.openAt}).`;
  }
  if (endMinutes24 > stationWindow.closeMinutes24) {
    return `La salida no puede ser después del cierre (${stationWindow.closeAt}).`;
  }

  const endBounds = getEndTimeBoundsForWindow(agenda, {
    dateKey: options.dateKey,
    startMinutes24,
    currentUserId: options.currentUserId,
    now: options.now,
  });
  if (endMinutes24 > endBounds.maxMinutes24) {
    const msg = formatLimitHintMessage(endBounds, ctx.graceMinutes);
    if (msg) return msg;
    return 'La salida no puede extenderse hasta ese horario.';
  }
  if (endMinutes24 < endBounds.minMinutes24) {
    return `La salida debe ser al menos ${ctx.minReservationMinutes} minutos después del inicio.`;
  }

  const startBounds = getStartTimeBounds(ctx, endMinutes24, options.currentUserId);
  if (startMinutes24 < startBounds.minMinutes24) {
    if (startBounds.limitHint?.previousBlockEndMinutes24 != null) {
      return `El bloque anterior termina a las ${formatMinutes24AsHhMm(startBounds.limitHint.previousBlockEndMinutes24)} (incluye margen de desconexión).`;
    }
    return 'El inicio no puede ser antes de ese horario.';
  }
  if (startMinutes24 > startBounds.maxMinutes24) {
    return `El inicio debe ser al menos ${ctx.minReservationMinutes} minutos antes de la salida.`;
  }

  if (windowOverlapsOther(ctx, startMinutes24, endMinutes24, options.currentUserId)) {
    return 'Ese horario se solapa con otra reserva o sesión de carga en el conector (incluye margen de desconexión).';
  }
  return null;
}

export function hasBookableReservationSlotsForDate(
  agenda: ConnectorAgendaResponse,
  options: {
    dateKey: string;
    currentUserId?: string | null;
    now?: Date;
    stepMinutes?: number;
  },
): boolean {
  return (
    findFirstFreeReservationWindow(agenda, options) !== null
  );
}

export function findFirstFreeReservationWindow(
  agenda: ConnectorAgendaResponse,
  options: {
    dateKey: string;
    currentUserId?: string | null;
    now?: Date;
    stepMinutes?: number;
  },
): ReservationWindowMinutes | null {
  const step = options.stepMinutes ?? RESERVATION_DRAG_STEP_MINUTES;
  const ctx = buildReservationWindowContext(agenda, {
    dateKey: options.dateKey,
    now: options.now,
  });
  const { stationWindow, minReservationMinutes } = ctx;
  const lastStart =
    stationWindow.closeMinutes24 - minReservationMinutes;

  for (
    let start = roundMinutes24ToStep(ctx.earliestBookableMinutes24, step);
    start <= lastStart;
    start += step
  ) {
    const end = start + minReservationMinutes;
    if (
      isReservationWindowValid(
        ctx,
        { startMinutes24: start, endMinutes24: end },
        options.currentUserId,
      )
    ) {
      return { startMinutes24: start, endMinutes24: end };
    }
  }
  return null;
}

export function formatReservationWindowLabel(
  window: ReservationWindowMinutes,
): string {
  return `${formatMinutes24AsHhMm(window.startMinutes24)} – ${formatMinutes24AsHhMm(window.endMinutes24)}`;
}

export {
  departureTimeValueToDate,
  formatTimePickerValue,
  timePickerValueToMinutes24,
} from './departureTime';
