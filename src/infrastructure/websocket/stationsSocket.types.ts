export interface ConnectorStatusUpdate {
  type: 'connector-status-updated';
  data: {
    stationId: string;
    connectorId: string;
    connectorNumber: number;
    status: 'Available' | 'Occupied';
    chargePointId: string;
    ocppId: string;
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
