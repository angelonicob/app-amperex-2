import { useAccountStore } from '../user/store/useAccountStore';
import { getPendingPayments } from '../session/pendingPayment';
import { getActiveSession } from '../session/session';
import { useReservationStore } from './store/useReservationStore';
import { navigationRef } from '../../presentation/routes/navigationRef';

export type CreateReservationPreflightFailure = {
  ok: false;
  reason: 'active' | 'no_vehicle' | 'debt' | 'charging';
  title: string;
  message: string;
  pendingSessionId?: string;
};

export type CreateReservationPreflightResult =
  | { ok: true }
  | CreateReservationPreflightFailure;

export function exitCreateReservationFlow(): void {
  useReservationStore.getState().clearAgenda();
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export async function runCreateReservationPreflight(): Promise<CreateReservationPreflightResult> {
  const { hasActiveReservation } = useReservationStore.getState();
  if (hasActiveReservation()) {
    return {
      ok: false,
      reason: 'active',
      title: 'Reserva activa',
      message:
        'Ya tienes una reserva. Cancélala en Mis reservas antes de crear otra.',
    };
  }

  const vehicles = useAccountStore.getState().vehicles;
  if (vehicles.length === 0) {
    return {
      ok: false,
      reason: 'no_vehicle',
      title: 'Sin vehículos',
      message: 'Debes crear un auto para poder agendar un conector.',
    };
  }

  try {
    const activeSession = await getActiveSession();
    if (activeSession.session?.startedAt) {
      return {
        ok: false,
        reason: 'charging',
        title: 'Sesión de carga activa',
        message:
          'No puedes crear una reserva mientras tienes una sesión de carga activa.',
      };
    }
  } catch {
    // Si falla el chequeo, confiar en el backend al crear.
  }

  try {
    const pending = await getPendingPayments();
    if (pending.hasDebt && pending.oldest?.sessionId) {
      return {
        ok: false,
        reason: 'debt',
        title: 'Pago pendiente',
        message:
          'Tienes una carga pendiente de pago. Debes pagar antes de crear una reserva.',
        pendingSessionId: pending.oldest.sessionId,
      };
    }
  } catch {
    // Si falla el chequeo de deuda, no bloquear; el backend validará en agenda/create.
  }

  return { ok: true };
}
