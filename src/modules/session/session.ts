import { api } from '../../infrastructure/http/Api';

export interface ChargeProfile {
  maxPowerKw?: number;
  targetEnergy?: number;
  departureTime?: string; // ISO 8601 format
}

export type ChargingMode = 'TARGET' | 'FULL';

export interface StartSessionRequest {
  correlationId: string;
  vehicleId: string;
  mode: ChargingMode;
  initialSocPercent: number;
  targetSocPercent?: number;
  chargeProfile?: ChargeProfile;
}

export interface StartSessionResponse {
  success: boolean;
  correlationId: string; // commandCorrelationId
  message: string;
}

function toOptionalFiniteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    // Aceptar coma decimal (p.ej. "7,2") y limpiar unidades (p.ej. "22 kW")
    const cleaned = trimmed
      .replace(',', '.')
      .replace(/[^\d.+-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
}

function normalizeChargeProfile(
  chargeProfile: unknown,
): ChargeProfile | undefined {
  if (!chargeProfile || typeof chargeProfile !== 'object') return undefined;
  const cp = chargeProfile as Record<string, unknown>;

  const normalized: ChargeProfile = {};
  const maxPowerKw = toOptionalFiniteNumber(cp.maxPowerKw);
  if (maxPowerKw !== undefined && maxPowerKw >= 0) {
    normalized.maxPowerKw = maxPowerKw;
  }
  const targetEnergy = toOptionalFiniteNumber(cp.targetEnergy);
  if (targetEnergy !== undefined && targetEnergy >= 0) {
    normalized.targetEnergy = targetEnergy;
  }
  if (typeof cp.departureTime === 'string' && cp.departureTime.trim()) {
    normalized.departureTime = cp.departureTime;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export const startSession = async (
  data: StartSessionRequest,
): Promise<StartSessionResponse | null> => {
  try {
    const payload: StartSessionRequest = {
      ...data,
      chargeProfile: normalizeChargeProfile(data.chargeProfile),
    };
    const { data: response } = await api.post<StartSessionResponse>(
      'session/start',
      payload,
    );
    return response;
  } catch (error: any) {
    console.error('Error starting session:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return null;
  }
};

export interface PlugStatusResponse {
  correlationId: string;
  reservationExpiresAt: string | null;
  readyToStart: boolean;
  connector: {
    id: string;
    connectorNumber: number;
    status: string;
    statusOcpp: string;
    lastStatusUpdate: string | null;
    connectorType?: string | null;
    price?: number;
    powerKw?: number | null;
  };
  chargePoint: {
    id: string;
    ocppId: string;
    stationId: string;
  } | null;
}

export const getPlugStatus = async (
  correlationId: string,
): Promise<PlugStatusResponse | null> => {
  try {
    const { data } = await api.get<PlugStatusResponse>(
      `session/plug-status/${correlationId}`,
    );
    return data;
  } catch (error: any) {
    console.error('Error getting plug status:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return null;
  }
};

export interface EstimateSessionRequest {
  correlationId: string;
  vehicleId: string;
  mode: ChargingMode;
  initialSocPercent: number;
  targetSocPercent?: number;
}

export interface EstimateSessionResponse {
  correlationId: string;
  mode: ChargingMode;
  initialSocPercent: number;
  targetSocPercent: number;
  estimatedEnergyKwh: number;
  estimatedDurationSeconds: number | null;
  estimatedCostClp: number;
  priceClpPerKwh: number;
  connectorPowerKw: number | null;
}

export const estimateSession = async (
  data: EstimateSessionRequest,
): Promise<EstimateSessionResponse | null> => {
  try {
    const { data: response } = await api.post<EstimateSessionResponse>(
      'session/estimate',
      data,
    );
    return response;
  } catch (error: any) {
    console.error('Error estimating session:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return null;
  }
};

export interface SessionStatusResponse {
  ready: boolean;
  status: string;
  sessionId?: string;
  message: string;
}

export const checkSessionStatus = async (
  correlationId: string,
): Promise<SessionStatusResponse | null> => {
  try {
    const { data: response } = await api.get<SessionStatusResponse>(
      `session/status/${correlationId}`,
    );
    return response;
  } catch (error: any) {
    console.error('Error checking session status:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return null;
  }
};

export interface StopSessionResponse {
  success: boolean;
  sessionId: string;
  correlationId: string;
  message: string;
}

/**
 * Envía comando de detención de carga al backend.
 * @throws Error con response.status y response.data para 4xx/5xx
 */
export const stopSession = async (
  sessionId: string,
): Promise<StopSessionResponse> => {
  const { data } = await api.post<StopSessionResponse>('session/stop', {
    sessionId,
  });
  return data;
};

// --- Sesión activa (restauración al reabrir app) ---

export interface ActiveSession {
  id: string;
  status: string;
  startedAt: string | null;
  stationId: string;
  chargePointConnectorId: string | null;
  userId: string;
  station?: { id: string; name: string };
  chargePoint?: { id: string; ocppId: string };
}

export interface ActiveSessionResponse {
  session: ActiveSession | null;
}

/**
 * Obtiene la sesión de carga activa del usuario (CHARGING o STOPPING).
 * El backend responde siempre 200 con { session } (session puede ser null).
 */
export const getActiveSession = async (): Promise<ActiveSessionResponse> => {
  const { data } = await api.get<ActiveSessionResponse>('session/active');
  return data;
};