import {
  createWebSocketClient,
  getBaseServerUrl,
  toWebSocketUrl,
} from './baseSocket';
import type { StationsWebSocketMessage } from './stationsSocket.types';

export type { ConnectorStatusUpdate } from './stationsSocket.types';

/**
 * Crea un cliente WebSocket para el canal de estaciones (broadcast de estado de conectores).
 * Requiere token de acceso Firebase (mismo esquema que /sessions).
 */
export function createStationsSocket(apiUrl: string, accessToken: string) {
  const baseUrl = getBaseServerUrl(apiUrl);
  const wsBaseUrl = toWebSocketUrl(baseUrl);

  const client = createWebSocketClient({
    getUrl: () =>
      `${wsBaseUrl}/stations?token=${encodeURIComponent(accessToken)}&actor=app`,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    shouldReconnect: (event) => {
      if (event.code === 1008 || event.reason?.includes('401')) return false;
      return !event.wasClean;
    },
  });

  return client;
}

export function isStationsWebSocketMessage(
  data: unknown,
): data is StationsWebSocketMessage {
  return typeof data === 'object' && data !== null && 'type' in data;
}
