/**
 * Inicializa expo-notifications y registra el token en el backend.
 * Si expo-notifications no está instalado, no hace nada.
 */
import { Platform } from 'react-native';
import { registerPushToken } from './api';

let initialized = false;

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
    initialized = true;
  } catch (e) {
    console.warn('Push notifications init failed', e);
  }
}
