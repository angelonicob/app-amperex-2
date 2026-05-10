export interface Connector {
  id: string;
  connectorId: number;
  status: string; // 'Available' u 'Occupied' (ConnectorStatus)
  powerKw: string | null;
  price: number | null;
  connectorType: string | null; // Nombre para mostrar (tipo de conector)
}

export interface ChargePoint {
  id: string;
  name: string;
  ocppId: string;
  connectors: Connector[];
  availableConnectors: number;
  totalConnectors: number;
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
  chargePoints: ChargePoint[];
  totalChargePoints: number;
  totalConnectors: number;
  availableConnectors: number;
}
