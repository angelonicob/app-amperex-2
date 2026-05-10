export interface ConnectorResponse {
  id: string;
  connectorId: number;
  status: string; // 'Available' u 'Occupied' (para mapas)
  powerKw: string | null;
  price: number | null;
  connectorType: string | null; // Nombre para mostrar (tipo de conector: name o code)
}

export interface ChargePointResponse {
  id: string;
  name?: string | null;
  ocppId: string;
  connectors: ConnectorResponse[];
  availableConnectors: number;
  totalConnectors: number;
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
  chargePoints: ChargePointResponse[];
  totalChargePoints: number;
  totalConnectors: number;
  availableConnectors: number;
}
