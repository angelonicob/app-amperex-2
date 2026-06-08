export type AgendaSlotStatus =
  | 'free'
  | 'reserved'
  | 'charging'
  | 'mine'
  | 'past'
  | 'closed';

export interface AgendaSlot {
  startAt: string;
  endAt: string;
  status: AgendaSlotStatus;
  reservationId?: string;
  sessionId?: string;
  occupancySource?: 'reservation' | 'session';
}

export interface AgendaActiveReservation {
  startAt: string;
  endAt: string;
  agendaBlockUntil: string;
  userId: string;
}

export interface AgendaActiveOccupancy extends AgendaActiveReservation {
  id: string;
  source: 'reservation' | 'session';
}

export interface ConnectorAgendaResponse {
  connector: {
    id: string;
    connectorId: number;
    connectorType: string | null;
    chargePointName: string | null;
    chargePointOcppId: string;
  };
  station: {
    id: string;
    name: string;
    openAt: string;
    closeAt: string;
  };
  operatingHours: {
    openMinutes: number;
    closeMinutes: number;
    crossesMidnight: boolean;
  };
  date: string;
  timezone: string;
  nowUtc: string;
  minAdvanceHours?: number;
  earliestBookableUtc?: string;
  /** Debe coincidir con RESERVATION_LATE_DEPARTURE_GRACE_MINUTES del backend. */
  lateDepartureGraceMinutes?: number;
  minReservationMinutes?: number;
  activeOccupancies?: AgendaActiveOccupancy[];
  activeReservations?: AgendaActiveReservation[];
  activeSessions?: AgendaActiveOccupancy[];
  slots: AgendaSlot[];
}

export interface ReservationConnectorInfo {
  id: string;
  connectorId: number;
  connectorType: string | null;
  chargePointName: string | null;
  chargePointOcppId: string;
}

export type EffectiveReservationStatus =
  | 'ACTIVE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'EXPIRED';

export interface ReservationConfirmationCopy {
  title: string;
  body: string;
}

export interface UserReservation {
  id: string;
  stationId: string;
  chargePointConnectorId: string | null;
  startAt: string;
  endAt: string;
  startAtLocal?: string;
  endAtLocal?: string;
  confirmedAt?: string | null;
  waitMinutes?: number;
  waitMinutesIfConfirmed?: number;
  waitMinutesIfNotConfirmed?: number;
  status: string;
  effectiveStatus: EffectiveReservationStatus;
  createdAt: string;
  updatedAt: string;
  station: {
    id: string;
    name: string;
    openAt?: string;
    closeAt?: string;
  };
  connector: ReservationConnectorInfo | null;
  session?: unknown;
}

export interface UserReservationsResponse {
  activa: UserReservation | null;
  history: UserReservation[];
}

export interface ReservationDetail extends UserReservation {
  confirmationCopy?: ReservationConfirmationCopy;
}

export interface CreateReservationPayload {
  stationId: string;
  chargePointConnectorId: string;
  startAtLocal: string;
  endAtLocal: string;
  timezone: string;
}
