export interface Station {
  id: number;
  name: string;
  token: string;
  latitude: string;
  longitude: string;
  powerKw: number;
  status: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionVehicle {
  id: number;
  userId: number;
  brand: string;
  model: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionReservation {
  id: number;
  userId: number;
  vehicleId: number;
  stationId: number;
  startAt: string;
  endAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionStartResponse {
  id: number;
  userId: number;
  vehicleId: number;
  stationId: number;
  reservationId: number;
  type: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  energyKwh: number | null;
  targetEnergyKwh: number;
  targetPorcentage: number;
  createdAt: string;
  updatedAt: string;
  station: Station;
  vehicle: SessionVehicle;
  reservation: SessionReservation;
}
