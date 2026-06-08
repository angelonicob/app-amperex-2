import type { TimePickerColumnsValue } from '../components/session/TimePickerColumns';

const DEFAULT_OPEN = '00:00';
const DEFAULT_CLOSE = '23:59';

/** Parsea "HH:mm" o "H:mm" a minutos desde medianoche (0–1439). */
export function parseHhMmToMinutes24(value: string | null | undefined): number | null {
  if (value == null || typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

export function getNowMinutes24(date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function timePickerValueToMinutes24(value: TimePickerColumnsValue): number {
  let h = value.hour;
  if (value.ampm === 'PM' && h !== 12) h += 12;
  if (value.ampm === 'AM' && h === 12) h = 0;
  return h * 60 + value.minute;
}

export function minutes24ToTimePickerValue(totalMinutes: number): TimePickerColumnsValue {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.floor(totalMinutes)));
  const h24 = Math.floor(clamped / 60);
  const minute = clamped % 60;
  const ampm: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour: hour12, minute, ampm };
}

export interface StationHoursWindow {
  openAt: string;
  closeAt: string;
  openMinutes24: number;
  closeMinutes24: number;
}

export function resolveStationHoursWindow(
  openAt?: string | null,
  closeAt?: string | null,
): StationHoursWindow {
  const openMinutes24 = parseHhMmToMinutes24(openAt) ?? parseHhMmToMinutes24(DEFAULT_OPEN)!;
  const closeMinutes24 = parseHhMmToMinutes24(closeAt) ?? parseHhMmToMinutes24(DEFAULT_CLOSE)!;
  return {
    openAt: openAt?.trim() || DEFAULT_OPEN,
    closeAt: closeAt?.trim() || DEFAULT_CLOSE,
    openMinutes24,
    closeMinutes24,
  };
}

export interface DepartureTimeBounds {
  minMinutes24: number;
  maxMinutes24: number;
}

/** Ventana seleccionable: después de ahora y hasta el cierre (y fin de reserva si aplica). */
export function getDepartureTimeBounds(
  stationWindow: StationHoursWindow,
  options?: {
    nowMinutes24?: number;
    reservationEndMinutes24?: number | null;
  },
): DepartureTimeBounds {
  const nowMinutes24 = options?.nowMinutes24 ?? getNowMinutes24();
  const minMinutes24 = Math.max(
    nowMinutes24 + 1,
    stationWindow.openMinutes24,
  );
  let maxMinutes24 = stationWindow.closeMinutes24;
  if (
    options?.reservationEndMinutes24 != null &&
    Number.isFinite(options.reservationEndMinutes24)
  ) {
    maxMinutes24 = Math.min(maxMinutes24, options.reservationEndMinutes24);
  }
  return { minMinutes24, maxMinutes24 };
}

export function isDepartureMinutes24InBounds(
  minutes24: number,
  bounds: DepartureTimeBounds,
): boolean {
  return (
    minutes24 >= bounds.minMinutes24 && minutes24 <= bounds.maxMinutes24
  );
}

export function isDepartureTimeValid(
  value: TimePickerColumnsValue,
  bounds: DepartureTimeBounds,
): boolean {
  return isDepartureMinutes24InBounds(timePickerValueToMinutes24(value), bounds);
}

export function hasSelectableDepartureSlot(bounds: DepartureTimeBounds): boolean {
  return bounds.minMinutes24 <= bounds.maxMinutes24;
}

/** Primer horario válido: inmediatamente después de ahora (respetando apertura y topes). */
export function getDefaultDepartureTime(
  bounds: DepartureTimeBounds,
): TimePickerColumnsValue {
  if (!hasSelectableDepartureSlot(bounds)) {
    return minutes24ToTimePickerValue(getNowMinutes24());
  }
  return minutes24ToTimePickerValue(bounds.minMinutes24);
}

/** Ajusta al minuto válido más cercano dentro de los límites. */
export function clampDepartureTime(
  value: TimePickerColumnsValue,
  bounds: DepartureTimeBounds,
): TimePickerColumnsValue {
  if (!hasSelectableDepartureSlot(bounds)) return value;
  const current = timePickerValueToMinutes24(value);
  const clamped = Math.max(
    bounds.minMinutes24,
    Math.min(bounds.maxMinutes24, current),
  );
  return minutes24ToTimePickerValue(clamped);
}

export function parseIsoLocalToMinutes24(isoLocal: string | undefined): number | null {
  if (!isoLocal || isoLocal.length < 16) return null;
  const timePart = isoLocal.slice(11, 16);
  return parseHhMmToMinutes24(timePart);
}

export function formatMinutes24AsHhMm(minutes24: number): string {
  const h = Math.floor(minutes24 / 60);
  const m = minutes24 % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimePickerValue(value: TimePickerColumnsValue): string {
  const m = timePickerValueToMinutes24(value);
  return formatMinutes24AsHhMm(m);
}

export function validateDepartureTime(
  value: TimePickerColumnsValue,
  bounds: DepartureTimeBounds,
  stationWindow: StationHoursWindow,
): string | null {
  if (!hasSelectableDepartureSlot(bounds)) {
    return `No hay horarios de salida disponibles hoy. La estación cierra a las ${stationWindow.closeAt}.`;
  }
  const minutes24 = timePickerValueToMinutes24(value);
  const nowMinutes24 = getNowMinutes24();
  if (minutes24 <= nowMinutes24) {
    return 'El horario de salida debe ser posterior a la hora actual.';
  }
  if (minutes24 > stationWindow.closeMinutes24) {
    return `El horario de salida no puede ser después del cierre de la estación (${stationWindow.closeAt}).`;
  }
  if (minutes24 < stationWindow.openMinutes24) {
    return `El horario de salida no puede ser antes de la apertura (${stationWindow.openAt}).`;
  }
  if (!isDepartureMinutes24InBounds(minutes24, bounds)) {
    return 'El horario seleccionado no está dentro del rango permitido.';
  }
  return null;
}

export function isDepartureTimeOptionValid(
  hour: number,
  minute: number,
  ampm: 'AM' | 'PM',
  bounds: DepartureTimeBounds,
): boolean {
  return isDepartureMinutes24InBounds(
    timePickerValueToMinutes24({ hour, minute, ampm }),
    bounds,
  );
}

/** Fecha local de salida (hoy) a partir del valor del picker. */
export function departureTimeValueToDate(
  value: TimePickerColumnsValue,
  baseDate = new Date(),
): Date {
  const d = new Date(baseDate);
  let h = value.hour;
  if (value.ampm === 'PM' && h !== 12) h += 12;
  if (value.ampm === 'AM' && h === 12) h = 0;
  d.setHours(h, value.minute, 0, 0);
  return d;
}
