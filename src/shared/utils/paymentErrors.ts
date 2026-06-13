import { classifyApiFailure } from '../../infrastructure/http/apiErrorKind';

export type PaymentUserMessage = {
  title: string;
  body: string;
  /** Si true, sugiere cambiar de tarjeta en el flujo de pago. */
  suggestOtherCard?: boolean;
};

function extractApiMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    .response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  if (Array.isArray(message) && message.length > 0) {
    const first = message[0];
    return typeof first === 'string' ? first.trim() : null;
  }
  return null;
}

/** Mensaje para fallos al iniciar o completar inscripción OneClick. */
export function messageForInscriptionStartError(error: unknown): PaymentUserMessage {
  const kind = classifyApiFailure(error);
  if (kind === 'transport') {
    return {
      title: 'Sin conexión',
      body: 'No hay conexión a internet. Revisa tu red e inténtalo de nuevo.',
    };
  }
  if (kind === 'server') {
    return {
      title: 'Servicio no disponible',
      body: 'El servidor no respondió. Espera unos segundos e inténtalo nuevamente.',
    };
  }
  const api = extractApiMessage(error);
  return {
    title: 'Error',
    body: api ?? 'No se pudo iniciar la inscripción. Intenta de nuevo.',
  };
}

/** Mensaje para rechazo o error al autorizar cobro OneClick. */
export function messageForAuthorizeError(error: unknown): PaymentUserMessage {
  const kind = classifyApiFailure(error);
  if (kind === 'transport') {
    return {
      title: 'Sin conexión',
      body: 'No hay conexión a internet. El cobro no se procesó. Revisa tu red e inténtalo de nuevo.',
    };
  }
  if (kind === 'server') {
    return {
      title: 'Servicio no disponible',
      body: 'El servidor no respondió. Si el cargo apareció en tu banco, contacta a soporte antes de reintentar.',
    };
  }
  if (kind === 'auth') {
    return {
      title: 'Sesión expirada',
      body: 'Tu sesión caducó. Inicia sesión de nuevo e intenta el pago otra vez.',
    };
  }

  const api = extractApiMessage(error);
  const body =
    api ??
    'No se pudo procesar el pago con One Click. Intenta de nuevo o usa otra tarjeta.';

  const rejected =
    typeof api === 'string' &&
    (api.toLowerCase().includes('rechaz') ||
      api.toLowerCase().includes('rejected') ||
      /código\s*-?\d+/i.test(api));

  return {
    title: rejected ? 'Pago rechazado' : 'Error al pagar',
    body: rejected
      ? `${body} Puedes probar con otra tarjeta inscrita o reintentar más tarde.`
      : body,
    suggestOtherCard: rejected,
  };
}

export const INSCRIPTION_CONFIRM = {
  title: 'Inscribir tarjeta',
  body: 'Al continuar, serás redirigido a Transbank para registrar una tarjeta. Esta tarjeta podrá ser utilizada para realizar cobros futuros asociados a tus sesiones de carga.',
  labelConfirm: 'Continuar',
} as const;

export const INSCRIPTION_CANCELLED_MESSAGE: PaymentUserMessage = {
  title: 'Inscripción cancelada',
  body: 'Cancelaste el registro de tarjeta. Puedes intentarlo cuando quieras.',
};

export const INSCRIPTION_UNKNOWN_MESSAGE: PaymentUserMessage = {
  title: 'Resultado no confirmado',
  body: 'No se pudo confirmar el resultado de la inscripción. Revisa si tu tarjeta quedó registrada en la lista; si no, inténtalo nuevamente.',
};
