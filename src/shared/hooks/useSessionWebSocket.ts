import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
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
  /** Incrementa en cada session-update para forzar efectos aunque el payload sea similar. */
  const [updateSeq, setUpdateSeq] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ReturnType<typeof createSessionSocket> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isConnectedRef = useRef(false);

  const attachClient = useCallback(
    (client: ReturnType<typeof createSessionSocket>) => {
      client.setCallbacks({
        onOpen: () => {
          isConnectedRef.current = true;
          setIsConnected(true);
          setError(null);
          const sid = sessionIdRef.current;
          if (sid) client.joinSession(sid);
        },
        onClose: () => {
          isConnectedRef.current = false;
          setIsConnected(false);
        },
        onMessage: (data: unknown) => {
          if (!isSessionWebSocketMessage(data)) return;
          if (data.type === 'session-update') {
            setError(null);
            setLastUpdate(data);
            setUpdateSeq((n) => n + 1);
          } else if (data.type === 'error') {
            setError(data.error);
          }
        },
        onError: () => {
          isConnectedRef.current = false;
          setIsConnected(false);
          setError('Error de conexión WebSocket');
        },
      });
    },
    [],
  );

  const connectWithToken = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      const desiredSessionId = sessionIdRef.current;
      if (!desiredSessionId) return;

      const token = await getFirebaseIdToken(
        options?.forceRefresh ? { forceRefresh: true } : undefined,
      );
      if (!token) {
        isConnectedRef.current = false;
        setIsConnected(false);
        setError('No hay sesión de Firebase activa');
        return;
      }

      clientRef.current?.disconnect();
      const client = createSessionSocket(API_URL, token);
      clientRef.current = client;
      attachClient(client);
      client.connect();
    },
    [attachClient],
  );

  useEffect(() => {
    const desiredSessionId = sessionId?.trim() ? sessionId.trim() : null;
    sessionIdRef.current = desiredSessionId;

    if (!desiredSessionId) {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      isConnectedRef.current = false;
      setIsConnected(false);
      setLastUpdate(null);
      setUpdateSeq(0);
      setError(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      await connectWithToken();
      if (cancelled) {
        clientRef.current?.disconnect();
        clientRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      isConnectedRef.current = false;
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [sessionId, connectWithToken]);

  // Al volver del background el SO suele cerrar el WS; reconectar sin alarmar al usuario.
  useEffect(() => {
    const onAppStateChange = (next: AppStateStatus) => {
      if (next !== 'active' || !sessionIdRef.current) return;
      const ready = clientRef.current?.getReadyState?.() ?? WebSocket.CLOSED;
      if (!isConnectedRef.current || ready !== WebSocket.OPEN) {
        void connectWithToken({ forceRefresh: true });
      }
    };
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, [connectWithToken]);

  const reconnect = () => {
    void connectWithToken({ forceRefresh: true });
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    isConnectedRef.current = false;
    setIsConnected(false);
    setError(null);
  };

  return {
    isConnected,
    lastUpdate,
    updateSeq,
    error,
    reconnect,
    disconnect,
  };
}
