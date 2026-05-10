import Constants from 'expo-constants';

/**
 * Lee `extra` desde app.config.js (variables de .env inyectadas en build).
 * Usa fallbacks por si `expoConfig` no está disponible en algún contexto (manifest embebido / updates).
 */
export function getExpoExtra(): Record<string, unknown> {
  const direct = Constants.expoConfig?.extra;
  if (direct && typeof direct === 'object') {
    return direct as Record<string, unknown>;
  }

  const m2 = Constants.manifest2;
  if (m2?.extra && typeof m2.extra === 'object') {
    const x = m2.extra as {
      expoClient?: { extra?: Record<string, unknown> };
      [key: string]: unknown;
    };
    const clientExtra = x.expoClient?.extra;
    if (clientExtra && typeof clientExtra === 'object') {
      return { ...x, ...clientExtra } as Record<string, unknown>;
    }
    return x as Record<string, unknown>;
  }

  const m = Constants.manifest as { extra?: Record<string, unknown> } | null;
  if (m?.extra && typeof m.extra === 'object') {
    return m.extra;
  }

  return {};
}
