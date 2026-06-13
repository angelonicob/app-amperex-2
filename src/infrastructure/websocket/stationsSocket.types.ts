export type ConnectorOperativeStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'MAINTENANCE'
  | 'DISCONNECTED';

export type ChargePointConnectionState = 'ONLINE' | 'OFFLINE';

export interface ConnectorStatusUpdate {
  type: 'connector-status-updated';
  data: {
    stationId: string;
    connectorId: string;
    connectorNumber: number;
    status: 'Available' | 'Occupied';
    chargePointId: string;
    ocppId: string;
    /** Opcionales: vienen del backend nuevo para que la app recalcule "Inactivo". */
    connectionState?: ChargePointConnectionState;
    chargePointOperativeStatus?: ConnectorOperativeStatus;
    connectorOperativeStatus?: ConnectorOperativeStatus;
    sessionPreparing?: boolean;
    timestamp: string;
  };
}

export interface ConnectedMessage {
  type: 'connected';
  message: string;
  timestamp: string;
}

export type StationsWebSocketMessage =
  | ConnectorStatusUpdate
  | ConnectedMessage;
