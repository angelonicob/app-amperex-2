export interface SessionUpdate {
  type: 'session-update';
  data: {
    sessionId: string;
    status:
      | 'CREATED'
      | 'AUTHORIZED'
      | 'STARTING'
      | 'CHARGING'
      | 'STOPPING'
      | 'FINISHED'
      | 'FAILED';
    energyKwh?: number;
    powerKw?: number;
    currentPercentage?: number;
    currentCost?: number;
    startedAt?: string;
    targetEnergyKwh?: number;
    mode?: 'TARGET' | 'FULL' | 'AMOUNT';
    finalEnergy?: number;
    finalPercentage?: number;
    totalCost?: number;
    currency?: string;
    pricePerKwh?: number;
    totalDurationSeconds?: number;
    reason?: string;
    ocppTransactionId?: string;
    meterStart?: number;
    voltageV?: { L1: number; L2: number; L3: number };
    currentA?: { L1: number; L2: number; L3: number };
    timestamp?: string;
    message?: string;
    finishedAt?: string;
    /** false si no aplica cobro One Click. */
    paymentRequired?: boolean;
    noPaymentReason?: 'ZERO_ENERGY' | 'PRIVATE_STATION';
  };
  timestamp: string;
}

export interface ConnectedMessage {
  type: 'connected';
  message: string;
  userId: string;
  timestamp: string;
}

export interface JoinSessionSuccess {
  type: 'join-session-success';
  data: {
    success: boolean;
    message: string;
    sessionId: string;
    session: { id: string; status: string };
  };
}

export interface ErrorMessage {
  type: 'error';
  error: string;
  timestamp: string;
}

export type SessionWebSocketMessage =
  | SessionUpdate
  | ConnectedMessage
  | JoinSessionSuccess
  | ErrorMessage;
