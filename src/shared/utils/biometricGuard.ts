import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Resultado de `requireBiometricForPayment`.
 *
 * - `authenticated`: el usuario aprobó el prompt (huella, Face ID, PIN del dispositivo).
 * - `unavailable`: el dispositivo no tiene hardware o ningún factor enrolado;
 *   el caller decide si permitir el cobro (ya está autenticado en la app vía Firebase).
 * - `cancelled`: el usuario rechazó el prompt o pulsó "Cancelar".
 * - `failed`: error de hardware u otro motivo no recuperable.
 */
export type BiometricGuardResult =
  | { ok: true; reason: 'authenticated' | 'unavailable' }
  | { ok: false; reason: 'cancelled' | 'failed'; message?: string };

/**
 * Pide autenticación local (biometría con fallback a PIN del dispositivo)
 * antes de operaciones sensibles como autorizar un cobro One Click (#3.1).
 *
 * Política:
 * - Si no hay hardware (emulador o equipo sin sensores) o no hay biometría
 *   enrolada → `unavailable` (no bloqueamos: el usuario ya está autenticado
 *   con Firebase, y forzar PIN sin enrolar daría una UX hostil).
 * - Si el usuario cancela → `cancelled` (el cobro NO procede).
 * - Si la autenticación falla por errores no recuperables → `failed`.
 */
export async function requireBiometricForPayment(
  promptMessage: string,
): Promise<BiometricGuardResult> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { ok: true, reason: 'unavailable' };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { ok: true, reason: 'unavailable' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false, // habilita PIN/passcode del dispositivo si falla la biometría
      requireConfirmation: false,
    });

    if (result.success) {
      return { ok: true, reason: 'authenticated' };
    }

    const cancelledReasons = new Set([
      'user_cancel',
      'system_cancel',
      'app_cancel',
      'user_fallback',
    ]);
    if (cancelledReasons.has(result.error ?? '')) {
      return { ok: false, reason: 'cancelled', message: result.error };
    }
    return { ok: false, reason: 'failed', message: result.error };
  } catch (err) {
    return {
      ok: false,
      reason: 'failed',
      message: err instanceof Error ? err.message : 'unknown',
    };
  }
}
