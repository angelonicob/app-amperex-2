import type { ChargingMode, ActiveSession } from './session';
import type { ChargingData } from './store/useSessionStore';

function toChargingStatus(status: string): ChargingData['status'] | undefined {
  if (
    status === 'CHARGING' ||
    status === 'STOPPING' ||
    status === 'FINISHED' ||
    status === 'FAILED'
  ) {
    return status;
  }
  return undefined;
}

/** Convierte la sesión activa del backend en datos de UI para la pantalla de carga. */
export function activeSessionToChargingData(
  session: ActiveSession,
): ChargingData {
  const chargingStatus = toChargingStatus(session.status);

  const data: ChargingData = {
    sessionId: session.id,
    ...(chargingStatus ? { status: chargingStatus } : {}),
    startedAt: session.startedAt ?? undefined,
    ...(session.plannedDepartureAt
      ? { departureTime: session.plannedDepartureAt }
      : {}),
  };

  if (session.energyKwh != null && Number.isFinite(session.energyKwh)) {
    data.energyKwh = session.energyKwh;
  }
  if (session.currentCost != null && Number.isFinite(session.currentCost)) {
    data.currentCost = session.currentCost;
  }
  if (
    session.currentPercentage != null &&
    Number.isFinite(session.currentPercentage)
  ) {
    data.currentPercentage = session.currentPercentage;
  }
  if (session.pricePerKwh != null && Number.isFinite(session.pricePerKwh)) {
    data.priceClpPerKwh = session.pricePerKwh;
    data.currency = session.currency ?? 'CLP';
  }
  if (session.mode) {
    data.mode = session.mode as ChargingMode;
  }
  if (
    session.targetEnergyKwh != null &&
    Number.isFinite(session.targetEnergyKwh) &&
    session.targetEnergyKwh > 0
  ) {
    data.estimatedEnergyKwh = session.targetEnergyKwh;
  }
  if (session.meterStart != null && Number.isFinite(session.meterStart)) {
    data.meterStart = session.meterStart;
  }

  return data;
}

/** Mapea campos de un `session-update` al store de carga. */
export function sessionUpdateToChargingData(update: {
  sessionId: string;
  status: string;
  ocppTransactionId?: string;
  startedAt?: string;
  meterStart?: number;
  energyKwh?: number;
  powerKw?: number;
  currentPercentage?: number;
  currentCost?: number;
  pricePerKwh?: number;
  currency?: string;
  targetEnergyKwh?: number;
  mode?: 'TARGET' | 'FULL' | 'AMOUNT';
  finalEnergy?: number;
  finalPercentage?: number;
  totalCost?: number;
  totalDurationSeconds?: number;
  voltageV?: { L1: number; L2: number; L3: number };
  currentA?: { L1: number; L2: number; L3: number };
  timestamp?: string;
  reason?: string;
  finishedAt?: string;
  message?: string;
  paymentRequired?: boolean;
  noPaymentReason?: 'ZERO_ENERGY' | 'PRIVATE_STATION';
}): ChargingData {
  const pricePerKwh = update.pricePerKwh;
  const chargingStatus = toChargingStatus(update.status);
  return {
    sessionId: update.sessionId,
    ...(chargingStatus ? { status: chargingStatus } : {}),
    ocppTransactionId: update.ocppTransactionId
      ? parseInt(String(update.ocppTransactionId), 10)
      : undefined,
    startedAt: update.startedAt,
    meterStart: update.meterStart,
    ...(update.energyKwh !== undefined ? { energyKwh: update.energyKwh } : {}),
    ...(update.powerKw !== undefined ? { powerKw: update.powerKw } : {}),
    ...(update.currentPercentage !== undefined
      ? { currentPercentage: update.currentPercentage }
      : {}),
    ...(update.currentCost !== undefined ? { currentCost: update.currentCost } : {}),
    voltageV: update.voltageV,
    currentA: update.currentA,
    timestamp: update.timestamp,
    ...(update.finalEnergy !== undefined ? { finalEnergy: update.finalEnergy } : {}),
    ...(update.finalPercentage != null
      ? { finalPercentage: update.finalPercentage }
      : {}),
    ...(update.totalCost != null ? { totalCost: update.totalCost } : {}),
    ...(update.totalDurationSeconds != null
      ? { totalDurationSeconds: update.totalDurationSeconds }
      : {}),
    ...(update.currency ? { currency: update.currency } : {}),
    ...(pricePerKwh !== undefined ? { priceClpPerKwh: pricePerKwh } : {}),
    ...(update.mode ? { mode: update.mode as ChargingMode } : {}),
    ...(update.targetEnergyKwh != null && update.targetEnergyKwh > 0
      ? { estimatedEnergyKwh: update.targetEnergyKwh }
      : {}),
    reason: update.reason,
    finishedAt: update.finishedAt,
    message: update.message,
    ...(typeof update.paymentRequired === 'boolean'
      ? { paymentRequired: update.paymentRequired }
      : {}),
    ...(update.noPaymentReason ? { noPaymentReason: update.noPaymentReason } : {}),
  };
}
