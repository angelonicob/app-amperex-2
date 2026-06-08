/**
 * Inicializa expo-notifications y registra el token en el backend.
 * Si expo-notifications no está instalado, no hace nada.
 */
import { Platform } from 'react-native';
import { registerPushToken } from './api';
import { useReservationConfirmStore } from '../reservation/store/useReservationConfirmStore';

let initialized = false;
let responseListenerRegistered = false;

const RESERVATION_PUSH_TYPES = new Set([
  'reservation_reminder_2h',
  'reservation_reminder_30m',
  'reservation_end',
  'reservation_charge_complete_early',
]);

function extractReservationId(data: unknown): string | null {
  if (data == null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const id = d.reservationId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function setupReservationPushResponseListener(): void {
  if (responseListenerRegistered) return;
  try {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    if (!Notifications?.addNotificationResponseReceivedListener) return;
    Notifications.addNotificationResponseReceivedListener((response) => {
      const content = response.notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;
      const type =
        typeof data?.type === 'string'
          ? data.type
          : typeof content.data === 'object' &&
              content.data != null &&
              'type' in (content.data as object)
            ? String((content.data as Record<string, unknown>).type)
            : '';
      if (!RESERVATION_PUSH_TYPES.has(type)) return;
      const reservationId = extractReservationId(data ?? content.data);
      if (reservationId) {
        useReservationConfirmStore.getState().openReservationId(reservationId);
      }
    });
    responseListenerRegistered = true;
  } catch {
    // expo-notifications no disponible
  }
}

export async function initPushNotifications(): Promise<void> {
  if (initialized) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let Notifications: typeof import('expo-notifications');
    try {
      Notifications = require('expo-notifications');
    } catch {
      console.warn('expo-notifications not available (use development build)');
      return;
    }
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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
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
    setupReservationPushResponseListener();
    initialized = true;
  } catch (e) {
    console.warn('Push notifications init failed', e);
  }
}
