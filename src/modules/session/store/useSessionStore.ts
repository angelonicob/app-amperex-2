import { create } from 'zustand';
import {
  startSession as startSessionApi,
  StartSessionRequest,
  StartSessionResponse,
  type ChargingMode,
  type StartSessionPaymentRequired,
} from '../session';
import { ScanQrResponse } from '../scanQr';
// Conexión de sesión: la app usa WebSocket nativo (useSessionWebSocket), no Socket.IO

export interface ChargingData {
  sessionId?: string;
  status?: 'CHARGING' | 'STOPPING' | 'FINISHED' | 'FAILED';
  ocppTransactionId?: number;
  startedAt?: string;
  meterStart?: number;
  energyKwh?: number;
  powerKw?: number;
  currentPercentage?: number;
  currentCost?: number;
  // Tarifa y moneda (para UI / resumen)
  currency?: 'CLP' | string;
  priceClpPerKwh?: number;
  // Datos finales (FINISHED)
  finalPercentage?: number;
  totalCost?: number;
  totalDurationSeconds?: number;
  voltageV?: { L1: number; L2: number; L3: number };
  currentA?: { L1: number; L2: number; L3: number };
  timestamp?: string;
  finalEnergy?: number;
  reason?: string;
  finishedAt?: string;
  message?: string;
  // Estimación (pre-carga)
  estimatedEnergyKwh?: number;
  estimatedCostClp?: number;
  estimatedDurationSeconds?: number | null;
  // Parámetros declarados por el usuario al iniciar (set localmente en StartSession).
  // Permiten mostrarlos en SessionChargeScreen sin pedirlos al backend.
  mode?: ChargingMode;
  departureTime?: string; // ISO 8601
  /** Del WS al finalizar: false si no aplica cobro One Click. */
  paymentRequired?: boolean;
  noPaymentReason?: 'ZERO_ENERGY' | 'PRIVATE_STATION';
}

/** Referencia opcional a una conexión (legacy). El flujo actual usa useSessionWebSocket (WebSocket nativo). */
export type SessionConnection = WebSocket | null;

export interface SessionState {
  scanQrResponse: ScanQrResponse | null;
  startSessionResponse: StartSessionResponse | null;
  socket: SessionConnection;
  chargingData: ChargingData | null;
  isCharging: boolean;
  startSession: (
    data: StartSessionRequest,
  ) => Promise<StartSessionResponse | StartSessionPaymentRequired | null>;
  clearSession: () => void;
  setScanQrResponse: (response: ScanQrResponse | null) => void;
  setSocket: (socket: SessionConnection) => void;
  setChargingData: (data: ChargingData | null) => void;
  setIsCharging: (isCharging: boolean) => void;
}

function isStartSessionResponse(
  value: StartSessionResponse | StartSessionPaymentRequired,
): value is StartSessionResponse {
  return 'success' in value;
}

export const useSessionStore = create<SessionState>()(set => ({
  scanQrResponse: null,
  startSessionResponse: null,
  socket: null,
  chargingData: null,
  isCharging: false,

  startSession: async (data: StartSessionRequest) => {
    const response = await startSessionApi(data);
    // Solo persistimos el response cuando es el éxito "clásico"; el caso
    // paymentRequired se maneja en la pantalla (navega a Pago) y no debe
    // ensanchar el tipo del slice `startSessionResponse`.
    if (response && isStartSessionResponse(response)) {
      set({ startSessionResponse: response });
    }
    return response;
  },

  setScanQrResponse: (response: ScanQrResponse | null) => {
    set({ scanQrResponse: response });
  },

  setSocket: (socket: SessionConnection) => {
    set({ socket });
  },

  setChargingData: (data: ChargingData | null) => {
    if (!data) {
      set({ chargingData: null });
      return;
    }
    // Merge shallow sin pisar con `undefined` (algunos WS omiten campos y borraban costo/tarifa).
    set(state => {
      const prev = state.chargingData ?? {};
      const next: ChargingData = { ...prev };
      for (const [key, value] of Object.entries(data) as [keyof ChargingData, unknown][]) {
        if (value !== undefined) {
          (next as Record<string, unknown>)[key as string] = value as unknown;
        }
      }
      return { chargingData: next };
    });
  },

  setIsCharging: (isCharging: boolean) => {
    set({ isCharging });
  },

  clearSession: () => {
    const { socket } = useSessionStore.getState();
    if (socket && 'close' in socket) {
      socket.close();
    }
    set({
      scanQrResponse: null,
      startSessionResponse: null,
      socket: null,
      chargingData: null,
      isCharging: false,
    });
  },
}));
