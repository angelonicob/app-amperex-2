export type OperativeStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'DISCONNECTED';

export type ConnectionState = 'ONLINE' | 'OFFLINE';

export interface Connector {
  id: string;
  connectorId: number;
  status: string; // 'Available' u 'Occupied' (ConnectorStatus)
  operativeStatus: OperativeStatus;
  powerKw: string | null;
  price: number | null;
  connectorType: string | null; // Código del tipo de conector (p. ej. "CCS2", "TYPE2")
}

export interface ChargePoint {
  id: string;
  name: string;
  ocppId: string;
  operativeStatus: OperativeStatus;
  connectionState: ConnectionState;
  connectors: Connector[];
  availableConnectors: number;
  totalConnectors: number;
}

export interface StationAddress {
  rawAddress: string | null;
}

export interface Station {
  id: string;
  name: string;
  token: string;
  latitude: string;
  longitude: string;
  openAt?: string | null; // HH:mm
  closeAt?: string | null; // HH:mm
  operativeStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  address: StationAddress | null;
  chargePoints: ChargePoint[];
  totalChargePoints: number;
  totalConnectors: number;
  availableConnectors: number;
}
