import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../../infrastructure/http/Api';
import { getFirebaseIdToken } from '../../infrastructure/firebase/firebaseSession';
import {
  createSessionSocket,
  isSessionWebSocketMessage,
  type SessionUpdate,
} from '../../infrastructure/websocket';

/**
 * Hook para conectarse al WebSocket de sesiones de carga.
 * Usa la capa de infraestructura (websocket/sessionSocket).
 */
export function useSessionWebSocket(
  sessionId: string | null | undefined,
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<SessionUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ReturnType<typeof createSessionSocket> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const desiredSessionId = sessionId?.trim() ? sessionId.trim() : null;
    sessionIdRef.current = desiredSessionId;

    if (!desiredSessionId) {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      setIsConnected(false);
      setLastUpdate(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      const token = await getFirebaseIdToken();
      if (cancelled) return;
      if (!token) {
        setIsConnected(false);
        setError('No hay sesión de Firebase activa');
        return;
      }

      const client = createSessionSocket(API_URL, token);
      clientRef.current = client;

      client.setCallbacks({
        onOpen: () => {
          setIsConnected(true);
          setError(null);
          const sid = sessionIdRef.current;
          if (sid) client.joinSession(sid);
        },
        onClose: () => setIsConnected(false),
        onMessage: (data: unknown) => {
          if (!isSessionWebSocketMessage(data)) return;
          if (data.type === 'session-update') {
            setLastUpdate(data);
          } else if (data.type === 'error') {
            setError(data.error);
          }
        },
        onError: () => {
          setIsConnected(false);
          setError('Error de conexión WebSocket');
        },
      });

      client.connect();
    };
    void run();

    return () => {
      cancelled = true;
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [sessionId]);

  const reconnect = () => {
    void (async () => {
      const desiredSessionId = sessionIdRef.current;
      if (!desiredSessionId) return;
      const token = await getFirebaseIdToken({ forceRefresh: true });
      if (!token) {
        setIsConnected(false);
        setError('No hay sesión de Firebase activa');
        return;
      }
      clientRef.current?.disconnect();
      const client = createSessionSocket(API_URL, token);
      clientRef.current = client;
      client.setCallbacks({
        onOpen: () => {
          setIsConnected(true);
          setError(null);
          const sid = sessionIdRef.current;
          if (sid) client.joinSession(sid);
        },
        onClose: () => setIsConnected(false),
        onMessage: (data: unknown) => {
          if (!isSessionWebSocketMessage(data)) return;
          if (data.type === 'session-update') setLastUpdate(data);
          else if (data.type === 'error') setError(data.error);
        },
        onError: () => {
          setIsConnected(false);
          setError('Error de conexión WebSocket');
        },
      });
      client.connect();
    })();
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsConnected(false);
    setError(null);
  };

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect,
    disconnect,
  };
}
