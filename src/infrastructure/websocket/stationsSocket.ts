import {
  createWebSocketClient,
  getBaseServerUrl,
  toWebSocketUrl,
} from './baseSocket';
import type { StationsWebSocketMessage } from './stationsSocket.types';

export type { ConnectorStatusUpdate } from './stationsSocket.types';

/**
 * Crea un cliente WebSocket para el canal de estaciones (broadcast de estado de conectores).
 */
export function createStationsSocket(apiUrl: string) {
  const baseUrl = getBaseServerUrl(apiUrl);
  const wsBaseUrl = toWebSocketUrl(baseUrl);

  const client = createWebSocketClient({
    getUrl: () => `${wsBaseUrl}/stations`,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    shouldReconnect: (event) => !event.wasClean,
  });

  return client;
}

export function isStationsWebSocketMessage(
  data: unknown,
): data is StationsWebSocketMessage {
  return typeof data === 'object' && data !== null && 'type' in data;
}
