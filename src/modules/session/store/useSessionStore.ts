import { create } from 'zustand';
import {
  startSession as startSessionApi,
  StartSessionRequest,
  StartSessionResponse,
} from '../session';
import { ScanQrResponse } from '../scanQr';
// Conexión de sesión: la app usa WebSocket nativo (useSessionWebSocket), no Socket.IO

export interface ChargingData {
  sessionId?: string;
  status?: 'CHARGING' | 'STOPPING' | 'FINISHED';
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
  ) => Promise<StartSessionResponse | null>;
  clearSession: () => void;
  setScanQrResponse: (response: ScanQrResponse | null) => void;
  setSocket: (socket: SessionConnection) => void;
  setChargingData: (data: ChargingData | null) => void;
  setIsCharging: (isCharging: boolean) => void;
}

export const useSessionStore = create<SessionState>()(set => ({
  scanQrResponse: null,
  startSessionResponse: null,
  socket: null,
  chargingData: null,
  isCharging: false,

  startSession: async (data: StartSessionRequest) => {
    const response = await startSessionApi(data);
    if (response) {
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
    // Merge shallow para no perder datos (p.ej. tarifa desde estimate vs updates de WS)
    set(state => ({
      chargingData: {
        ...(state.chargingData ?? {}),
        ...data,
      },
    }));
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
