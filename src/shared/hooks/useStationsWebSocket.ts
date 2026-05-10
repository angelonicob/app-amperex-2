import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../../infrastructure/http/Api';
import {
  createStationsSocket,
  isStationsWebSocketMessage,
  type ConnectorStatusUpdate,
} from '../../infrastructure/websocket';

/**
 * Hook para conectarse al WebSocket de estaciones (estado de conectores).
 * Usa la capa de infraestructura (websocket/stationsSocket).
 */
export function useStationsWebSocket(shouldConnect: boolean = true) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<ConnectorStatusUpdate | null>(null);
  const clientRef = useRef<ReturnType<typeof createStationsSocket> | null>(null);

  useEffect(() => {
    if (!shouldConnect) {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      setIsConnected(false);
      setLastUpdate(null);
      return;
    }

    const client = createStationsSocket(API_URL);
    clientRef.current = client;

    client.setCallbacks({
      onOpen: () => setIsConnected(true),
      onClose: () => setIsConnected(false),
      onMessage: (data: unknown) => {
        if (isStationsWebSocketMessage(data) && data.type === 'connector-status-updated') {
          setLastUpdate(data);
        }
      },
    });

    client.connect();

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [shouldConnect]);

  const reconnect = () => {
    if (shouldConnect && clientRef.current) {
      clientRef.current.disconnect();
      const client = createStationsSocket(API_URL);
      clientRef.current = client;
      client.setCallbacks({
        onOpen: () => setIsConnected(true),
        onClose: () => setIsConnected(false),
        onMessage: (data: unknown) => {
          if (isStationsWebSocketMessage(data) && data.type === 'connector-status-updated') {
            setLastUpdate(data);
          }
        },
      });
      client.connect();
    }
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setIsConnected(false);
  };

  return {
    isConnected,
    lastUpdate,
    reconnect,
    disconnect,
  };
}
