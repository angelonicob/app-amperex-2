import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../../infrastructure/http/Api';
import { getFirebaseIdToken } from '../../infrastructure/firebase/firebaseSession';
import {
  createStationsSocket,
  isStationsWebSocketMessage,
  type ConnectorStatusUpdate,
} from '../../infrastructure/websocket';

/**
 * Hook para conectarse al WebSocket de estaciones (estado de conectores).
 * Requiere sesión Firebase activa (token en query al upgrade).
 */
export function useStationsWebSocket(shouldConnect: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ConnectorStatusUpdate | null>(null);
  const clientRef = useRef<ReturnType<typeof createStationsSocket> | null>(null);

  const attachCallbacks = useCallback(
    (client: ReturnType<typeof createStationsSocket>) => {
      client.setCallbacks({
        onOpen: () => setIsConnected(true),
        onClose: () => setIsConnected(false),
        onMessage: (data: unknown) => {
          if (
            isStationsWebSocketMessage(data) &&
            data.type === 'connector-status-updated'
          ) {
            setLastUpdate(data);
          }
        },
      });
    },
    [],
  );

  const connectWithToken = useCallback(async () => {
    const token = await getFirebaseIdToken();
    if (!token) {
      setIsConnected(false);
      return;
    }

    clientRef.current?.disconnect();
    const client = createStationsSocket(API_URL, token);
    clientRef.current = client;
    attachCallbacks(client);
    client.connect();
  }, [attachCallbacks]);

  useEffect(() => {
    if (!shouldConnect) {
      clientRef.current?.disconnect();
      clientRef.current = null;
      setIsConnected(false);
      setLastUpdate(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const token = await getFirebaseIdToken();
      if (cancelled) return;
      if (!token) {
        setIsConnected(false);
        return;
      }

      clientRef.current?.disconnect();
      const client = createStationsSocket(API_URL, token);
      clientRef.current = client;
      attachCallbacks(client);
      client.connect();
    };

    void run();

    return () => {
      cancelled = true;
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, [shouldConnect, attachCallbacks]);

  const reconnect = useCallback(() => {
    if (!shouldConnect) return;
    void connectWithToken();
  }, [shouldConnect, connectWithToken]);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    lastUpdate,
    reconnect,
    disconnect,
  };
};
