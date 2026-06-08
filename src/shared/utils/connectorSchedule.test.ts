/**
 * Pruebas manuales / referencia (ejecutar con un runner si se añade al proyecto).
 * Valida reglas de gracia y solapamiento sin UI.
 */
import type { ConnectorAgendaResponse } from '../../modules/reservation/types';
import {
  buildEndTimeScheduleContext,
  buildReservationWindowContext,
  clampReservationWindow,
  findFirstFreeReservationWindow,
  getEarliestBookableMinutes24,
  getEndTimeBounds,
  getStartTimeBounds,
  hasBookableReservationSlotsForDate,
  isEndTimeMinutes24Valid,
  isReservationWindowValid,
  resolveStationHoursWindow,
  timePickerValueToMinutes24,
  validateReservationWindow,
} from './connectorSchedule';

function mockAgenda(
  overrides: Partial<ConnectorAgendaResponse> = {},
): ConnectorAgendaResponse {
  return {
    connector: {
      id: 'c1',
      connectorId: 1,
      connectorType: 'CCS2',
      chargePointName: 'CP1',
      chargePointOcppId: 'CP-1',
    },
    station: {
      id: 's1',
      name: 'Test',
      openAt: '08:00',
      closeAt: '22:00',
    },
    operatingHours: {
      openMinutes: 8 * 60,
      closeMinutes: 22 * 60,
      crossesMidnight: false,
    },
    date: '2026-05-20',
    timezone: 'America/Santiago',
    nowUtc: new Date('2026-05-20T14:00:00.000Z').toISOString(),
    lateDepartureGraceMinutes: 10,
    minReservationMinutes: 30,
    activeReservations: [],
    slots: [],
    ...overrides,
  };
}

// Ejemplo: reserva ajena 16:00 bloquea salida hasta 15:49 (gracia 10)
const agendaWithBlock = mockAgenda({
  activeReservations: [
    {
      userId: 'other',
      startAt: '2026-05-20T19:00:00.000Z',
      endAt: '2026-05-20T20:00:00.000Z',
      agendaBlockUntil: '2026-05-20T20:10:00.000Z',
    },
  ],
});

export function runConnectorScheduleSmokeTests(): void {
  const now = new Date('2026-05-20T14:00:00.000Z');
  const ctx = buildEndTimeScheduleContext(agendaWithBlock, {
    mode: 'session',
    dateKey: '2026-05-20',
    now,
  });
  const bounds = getEndTimeBounds(ctx, 'me');
  const cap = bounds.maxMinutes24;
  const okAtCap = isEndTimeMinutes24Valid(cap, ctx, bounds, 'me');
  const badAfter = isEndTimeMinutes24Valid(
    Math.min(cap + 5, 22 * 60),
    ctx,
    bounds,
    'me',
  );
  if (!okAtCap || badAfter) {
    throw new Error('connectorSchedule smoke: bounds/grace failed');
  }
  const reservationCtx = buildEndTimeScheduleContext(agendaWithBlock, {
    mode: 'reservation',
    dateKey: '2026-05-20',
    fixedStartAtUtc: '2026-05-20T15:00:00.000Z',
    now,
  });
  const resBounds = getEndTimeBounds(reservationCtx, 'me');
  const expectedMinEnd =
    reservationCtx.fixedStartMinutes24 + reservationCtx.minReservationMinutes;
  if (resBounds.minMinutes24 !== expectedMinEnd) {
    throw new Error('connectorSchedule smoke: min reservation duration failed');
  }

  const windowCtx = buildReservationWindowContext(agendaWithBlock, {
    dateKey: '2026-05-20',
    now,
  });
  const startBounds = getStartTimeBounds(windowCtx, 15 * 60 + 49, 'me');
  if (startBounds.minMinutes24 < 15 * 60 + 10) {
    throw new Error('connectorSchedule smoke: start bounds / previous block failed');
  }

  const freeWindow = findFirstFreeReservationWindow(agendaWithBlock, {
    dateKey: '2026-05-20',
    currentUserId: 'me',
    now,
  });
  if (!freeWindow || !isReservationWindowValid(windowCtx, freeWindow, 'me')) {
    throw new Error('connectorSchedule smoke: first free window failed');
  }

  const invalidWindow = { startMinutes24: 15 * 60, endMinutes24: 16 * 60 + 30 };
  const validationErr = validateReservationWindow(agendaWithBlock, invalidWindow, {
    dateKey: '2026-05-20',
    currentUserId: 'me',
    now,
  });
  if (!validationErr) {
    throw new Error('connectorSchedule smoke: overlap validation should fail');
  }

  const clamped = clampReservationWindow(
    agendaWithBlock,
    { startMinutes24: 15 * 60 + 2, endMinutes24: 16 * 60 + 7 },
    { dateKey: '2026-05-20', currentUserId: 'me', now },
  );
  if (!isReservationWindowValid(windowCtx, clamped, 'me')) {
    throw new Error('connectorSchedule smoke: clamp reservation window failed');
  }
}

/** 22:42 con 2 h de antelación: hoy no debe quedar ningún hueco de 30 min. */
export function runMinAdvanceHoursLateDayTests(): void {
  const dateKey = '2026-06-05';
  const now = new Date(2026, 5, 5, 22, 42, 0);
  const agenda = mockAgenda({
    date: dateKey,
    minAdvanceHours: 2,
    station: {
      id: 's1',
      name: 'Test',
      openAt: '08:00',
      closeAt: '23:00',
    },
    operatingHours: {
      openMinutes: 8 * 60,
      closeMinutes: 23 * 60,
      crossesMidnight: false,
    },
  });
  const stationWindow = resolveStationHoursWindow(
    agenda.station.openAt,
    agenda.station.closeAt,
  );

  const earliest = getEarliestBookableMinutes24(
    agenda,
    dateKey,
    stationWindow,
    now,
  );
  if (earliest !== stationWindow.closeMinutes24) {
    throw new Error(
      `minAdvance late day: expected no slots (earliest=${earliest}, close=${stationWindow.closeMinutes24})`,
    );
  }

  if (
    hasBookableReservationSlotsForDate(agenda, {
      dateKey,
      currentUserId: 'me',
      now,
    })
  ) {
    throw new Error('minAdvance late day: should have no bookable slots');
  }

  if (
    findFirstFreeReservationWindow(agenda, {
      dateKey,
      currentUserId: 'me',
      now,
    }) != null
  ) {
    throw new Error('minAdvance late day: findFirstFree should be null');
  }
}
