import { api } from '../../infrastructure/http/Api';
import { parsePaymentRequiredPayload } from './pendingPayment';

export interface ChargePoint {
  id: string;
  ocppId: string;
  operativeStatus?: string;
}

export interface StationScanQr {
  id: string;
  name: string;
  operativeStatus?: string;
  latitude?: string;
  longitude?: string;
  token?: string;
  status?: string;
}

export interface UserScanQr {
  id: string;
}

/** Reserva programada en BD detectada al escanear el QR del charge point correcto. */
export interface ProgrammedReservationScan {
  id: string;
  startAt: string;
  endAt: string;
  startAtLocal?: string;
  endAtLocal?: string;
}

export interface ScanQrResponse {
  user: UserScanQr;
  station: StationScanQr;
  chargePoint: ChargePoint;
  connector?: {
    id: string;
    connectorId: number;
  };
  correlationId: string;
  reservationExpiresAt?: string | null;
  programmedReservation?: ProgrammedReservationScan;
}

/** Cuerpo de `POST session/scan-qr`: solo `qrToken` (alineado con `ScanQrDto` del backend). */
export type ScanQrRequestBody = {
  qrToken: string;
};

export type ScanQrResult =
  | { ok: true; data: ScanQrResponse }
  | {
      ok: false;
      title: string;
      message: string;
      status: number | null;
      paymentRequired?: false;
    }
  | {
      ok: false;
      paymentRequired: true;
      pendingSessionId: string;
      amountClp: number;
      title: string;
      message: string;
      status: number;
    };

function parseBackendCode(data: unknown): string | null {
  if (data == null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const code = d.code;
  if (typeof code === 'string' && code.trim()) return code.trim();
  if (d.message != null && typeof d.message === 'object') {
    const nested = (d.message as Record<string, unknown>).code;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return null;
}

function parseBackendMessage(data: unknown): string | null {
  if (data == null || typeof data !== 'object') {
    return null;
  }
  const d = data as Record<string, unknown>;
  if (typeof d.message === 'string' && d.message.trim()) {
    return d.message.trim();
  }
  if (d.message != null && typeof d.message === 'object') {
    const nested = (d.message as Record<string, unknown>).message;
    if (typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }
  if (Array.isArray(d.message)) {
    const parts = d.message.map((m) => String(m)).filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  }
  if (typeof d.error === 'string' && d.error.trim()) {
    return d.error.trim();
  }
  return null;
}

/** Títulos y textos por defecto para errores HTTP del escaneo QR. */
export function formatScanQrFailure(
  status: number | null,
  data: unknown,
): { title: string; message: string } {
  const serverMsg = parseBackendMessage(data);
  const code = parseBackendCode(data);

  if (code === 'RESERVATION_TOO_EARLY') {
    return {
      title: 'Aún no es tu horario',
      message:
        serverMsg ??
        'Tu reserva aún no comienza. Escanea el QR cuando sea tu franja.',
    };
  }
  if (code === 'RESERVATION_TOO_LATE') {
    return {
      title: 'Tiempo de tolerancia agotado',
      message:
        serverMsg ??
        'Ya pasó el tiempo para conectar. Si tu franja sigue activa, contacta soporte.',
    };
  }
  if (code === 'RESERVATION_SLOT_ENDED') {
    return {
      title: 'Reserva finalizada',
      message: serverMsg ?? 'Tu franja de reserva ya terminó.',
    };
  }
  if (status === 402 || code === 'PAYMENT_REQUIRED') {
    return {
      title: 'Pago pendiente',
      message:
        serverMsg ??
        'Tienes una carga pendiente de pago. Debes pagar antes de escanear un nuevo QR.',
    };
  }

  if (status == null) {
    return {
      title: 'No pudimos continuar',
      message:
        'Lo sentimos, no pudimos completar la acción. Comprueba tu conexión a internet e inténtalo de nuevo.',
    };
  }

  if (status >= 400 && status < 500) {
    if (status === 401) {
      return {
        title: 'QR no válido',
        message:
          serverMsg ??
          'Este código QR no es válido o no corresponde a una estación Amperex. Escanea el código del punto de carga e inténtalo de nuevo.',
      };
    }
    if (status === 403) {
      return {
        title: 'Acceso no permitido',
        message:
          serverMsg ??
          'No tienes permiso para usar este código. Si el problema continúa, contacta a soporte.',
      };
    }
    if (status === 404) {
      return {
        title: 'No encontrado',
        message:
          serverMsg ??
          'No encontramos el punto de carga asociado a este QR. Verifica el código e inténtalo de nuevo.',
      };
    }
    if (status === 409) {
      return {
        title: 'No disponible',
        message:
          serverMsg ??
          'En este momento no se puede usar este recurso. Inténtalo más tarde.',
      };
    }
    if (status === 422) {
      return {
        title: 'Datos incorrectos',
        message:
          serverMsg ??
          'La solicitud no cumple las validaciones. Revisa el código e inténtalo de nuevo.',
      };
    }
    return {
      title: 'QR no válido',
      message:
        serverMsg ??
        'No se pudo validar el código escaneado. Inténtalo de nuevo.',
    };
  }

  return {
    title: 'Algo salió mal',
    message:
      serverMsg ??
      'Lo sentimos, hubo un inconveniente. Inténtalo de nuevo en unos minutos.',
  };
}

export const scanQrCode = async (qrToken: string): Promise<ScanQrResult> => {
  try {
    const body: ScanQrRequestBody = { qrToken };
    const { data } = await api.post<ScanQrResponse>('session/scan-qr', body);
    return { ok: true, data };
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: unknown };
      message?: string;
    };
    const status =
      typeof err?.response?.status === 'number' ? err.response.status : null;
    const payload = err?.response?.data;

    if (__DEV__) {
      console.error('Error scanning QR code:', {
        message: err?.message,
        status,
        data: payload,
      });
    }

    const { title, message } = formatScanQrFailure(status, payload);
    if (status === 402) {
      const payment = parsePaymentRequiredPayload(payload);
      if (payment) {
        return {
          ok: false,
          paymentRequired: true,
          pendingSessionId: payment.pendingSessionId,
          amountClp: payment.amountClp,
          title,
          message: payment.message,
          status,
        };
      }
    }
    return { ok: false, title, message, status };
  }
};
