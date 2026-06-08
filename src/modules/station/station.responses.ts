export type OperativeStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'DISCONNECTED';

export type ConnectionState = 'ONLINE' | 'OFFLINE';

export interface ConnectorResponse {
  id: string;
  connectorId: number;
  status: string; // 'Available' u 'Occupied' (para mapas)
  operativeStatus?: OperativeStatus;
  powerKw: string | null;
  price: number | null;
  connectorType: string | null; // Código del tipo de conector (p. ej. "CCS2", "TYPE2")
}

export interface ChargePointResponse {
  id: string;
  name?: string | null;
  ocppId: string;
  operativeStatus?: OperativeStatus;
  connectionState?: ConnectionState;
  connectors: ConnectorResponse[];
  availableConnectors: number;
  totalConnectors: number;
}

export interface StationAddressResponse {
  rawAddress?: string | null;
}

export interface StationResponse {
  id: string;
  name: string;
  token: string;
  latitude: string;
  longitude: string;
  openAt?: string | null; // HH:mm
  closeAt?: string | null; // HH:mm
  operativeStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  address?: StationAddressResponse | null;
  chargePoints: ChargePointResponse[];
  totalChargePoints: number;
  totalConnectors: number;
  availableConnectors: number;
}
