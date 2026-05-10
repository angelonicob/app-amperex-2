import {
  createWebSocketClient,
  getBaseServerUrl,
  toWebSocketUrl,
} from './baseSocket';
import type { SessionWebSocketMessage } from './sessionSocket.types';

export type { SessionUpdate } from './sessionSocket.types';
export type { JoinSessionSuccess, ErrorMessage } from './sessionSocket.types';

/**
 * Crea un cliente WebSocket para el canal de sesiones de carga.
 * Requiere token de acceso en la URL. No reconecta en 401/1008.
 */
export function createSessionSocket(apiUrl: string, accessToken: string) {
  const baseUrl = getBaseServerUrl(apiUrl);
  const wsBaseUrl = toWebSocketUrl(baseUrl);

  const client = createWebSocketClient({
    getUrl: () =>
      `${wsBaseUrl}/sessions?token=${encodeURIComponent(accessToken)}&actor=app`,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    shouldReconnect: (event) => {
      if (event.code === 1008 || event.reason?.includes('401')) return false;
      return !event.wasClean;
    },
  });

  function joinSession(sessionId: string) {
    client.send({ type: 'join-session', data: { sessionId } });
  }

  function leaveSession(sessionId: string) {
    client.send({ type: 'leave-session', data: { sessionId } });
  }

  return {
    ...client,
    joinSession,
    leaveSession,
  };
}

export function isSessionWebSocketMessage(
  data: unknown,
): data is SessionWebSocketMessage {
  return typeof data === 'object' && data !== null && 'type' in data;
}
