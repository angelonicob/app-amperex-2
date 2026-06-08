/**
 * Registro de push token y listeners. No solicita permisos del SO.
 */
import { Platform } from 'react-native';
import { getNotificationPermissionDetail } from '../permissions/notifications';
import { registerPushToken } from './api';
import { useReservationConfirmStore } from '../reservation/store/useReservationConfirmStore';
import { navigateToSessionCompletion } from '../../shared/utils/navigateToSessionCompletion';

let pushRegistered = false;
let responseListenerRegistered = false;

const RESERVATION_PUSH_TYPES = new Set([
  'reservation_reminder_2h',
  'reservation_reminder_30m',
  'reservation_end',
  'reservation_charge_complete_early',
]);

const SESSION_PUSH_TYPES = new Set(['charging_session_finished']);

function extractReservationId(data: unknown): string | null {
  if (data == null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const id = d.reservationId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function extractSessionId(data: unknown): string | null {
  if (data == null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const id = d.sessionId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function extractPushType(
  data: Record<string, unknown> | undefined,
  contentData: unknown,
): string {
  if (typeof data?.type === 'string') return data.type;
  if (
    typeof contentData === 'object' &&
    contentData != null &&
    'type' in (contentData as object)
  ) {
    return String((contentData as Record<string, unknown>).type);
  }
  return '';
}

export function setupReservationPushResponseListener(): void {
  if (responseListenerRegistered) return;
  try {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    if (!Notifications?.addNotificationResponseReceivedListener) return;
    Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;
      const type = extractPushType(data, content.data);
      const payload = data ?? content.data;

      if (SESSION_PUSH_TYPES.has(type)) {
        const sessionId = extractSessionId(payload);
        if (sessionId) {
          void navigateToSessionCompletion(sessionId).catch(() => {});
        }
        return;
      }

      if (!RESERVATION_PUSH_TYPES.has(type)) return;
      const reservationId = extractReservationId(payload);
      if (reservationId) {
        useReservationConfirmStore.getState().openReservationId(reservationId);
      }
    });
    responseListenerRegistered = true;
  } catch {
    // expo-notifications no disponible
  }
}

function configureNotificationHandler(): void {
  try {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    if (!Notifications?.setNotificationHandler) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // expo-notifications no disponible
  }
}

/** Registra el token push solo si el permiso ya está concedido. No pide permiso. */
export async function registerPushTokenIfGranted(): Promise<void> {
  try {
    let Notifications: typeof import('expo-notifications');
    try {
      Notifications = require('expo-notifications');
    } catch {
      return;
    }
    if (!Notifications?.getPermissionsAsync) return;

    configureNotificationHandler();

    const { status } = await getNotificationPermissionDetail();
    if (status !== 'granted') {
      return;
    }

    setupReservationPushResponseListener();

    if (pushRegistered) {
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: require('../../../app.json').expo?.extra?.eas?.projectId ?? undefined,
    });
    const pushToken = token?.data ?? token;
    if (pushToken) {
      await registerPushToken(
        pushToken,
        Platform.OS === 'ios' ? 'ios' : 'android',
      );
    }
    pushRegistered = true;
  } catch (e) {
    if (__DEV__) {
      console.warn('Push token registration failed', e);
    }
  }
}

/** Reinicia el flag de registro (p. ej. al cerrar sesión). */
export function resetPushRegistrationState(): void {
  pushRegistered = false;
}
