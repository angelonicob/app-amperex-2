/**
 * Utilidad para obtener la URL base del servidor desde la URL de la API.
 * Ejemplo: http://192.168.3.155:3000/api/v1/mobile/ -> http://192.168.3.155:3000
 */
export function getBaseServerUrl(apiUrl: string): string {
  const baseUrl = apiUrl.trim().replace(/\/$/, '');
  const urlPattern = /^(https?:\/\/[^/]+)(\/.*)?$/;
  const match = baseUrl.match(urlPattern);

  if (!match) {
    throw new Error(`URL inválida: ${apiUrl}`);
  }
  return match[1];
}

/**
 * Convierte URL HTTP(S) a WebSocket (ws/wss).
 */
export function toWebSocketUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/, 'ws');
}

export interface WebSocketClientCallbacks {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (data: unknown) => void;
  onError?: (error: Event) => void;
}

export interface WebSocketClientConfig {
  /** URL completa del WebSocket (o función que la devuelve, p. ej. con token). */
  getUrl: () => string;
  /** Máximo de intentos de reconexión. Default 5. */
  maxReconnectAttempts?: number;
  /** Delay en ms entre reconexiones. Default 3000. */
  reconnectDelay?: number;
  /** Si devuelve false, no se intenta reconectar (p. ej. 401). */
  shouldReconnect?: (event: CloseEvent) => boolean;
}

/**
 * Cliente WebSocket base con reconexión automática y callbacks.
 * La lógica de conexión/desconexión/reconexión y envío queda centralizada aquí.
 */
export function createWebSocketClient(config: WebSocketClientConfig) {
  const {
    getUrl,
    maxReconnectAttempts = 5,
    reconnectDelay = 3000,
    shouldReconnect = () => true,
  } = config;

  let ws: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let callbacks: WebSocketClientCallbacks = {};

  function connect() {
    if (ws) {
      const state = ws.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      ws = null;
    }

    try {
      const url = getUrl();
      ws = new WebSocket(url);

      ws.onopen = () => {
        reconnectAttempts = 0;
        callbacks.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as unknown;
          callbacks.onMessage?.(data);
        } catch {
          callbacks.onMessage?.(event.data);
        }
      };

      ws.onerror = (error) => {
        callbacks.onError?.(error);
      };

      ws.onclose = (event) => {
        ws = null;
        callbacks.onClose?.(event);

        if (
          shouldReconnect(event) &&
          reconnectAttempts < maxReconnectAttempts
        ) {
          reconnectAttempts += 1;
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connect();
          }, reconnectDelay);
        }
      };
    } catch (error) {
      callbacks.onError?.(error as Event);
    }
  }

  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    reconnectAttempts = maxReconnectAttempts;
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  function send(data: object | string) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  function setCallbacks(cbs: WebSocketClientCallbacks) {
    callbacks = cbs;
  }

  function getReadyState(): number {
    return ws?.readyState ?? WebSocket.CLOSED;
  }

  return {
    connect,
    disconnect,
    send,
    setCallbacks,
    getReadyState,
  };
}
