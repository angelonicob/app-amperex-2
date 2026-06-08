import type { NotificationPermissionStatus } from './types';

type NotificationsModule = typeof import('expo-notifications');

type NotificationPermissionResponse = {
  granted?: boolean;
  canAskAgain?: boolean;
};

function loadNotificationsModule(): NotificationsModule | null {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

function normalizeNotificationPermission(
  res: NotificationPermissionResponse,
): {
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
} {
  const canAskAgain = res.canAskAgain ?? false;
  if (res.granted === true) {
    return { status: 'granted', canAskAgain };
  }
  if (res.granted === false) {
    return { status: 'denied', canAskAgain };
  }
  return { status: 'undetermined', canAskAgain: canAskAgain || true };
}

export async function getNotificationPermissionDetail(): Promise<{
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
}> {
  const Notifications = loadNotificationsModule();
  if (!Notifications?.getPermissionsAsync) {
    return { status: 'undetermined', canAskAgain: false };
  }

  const res =
    (await Notifications.getPermissionsAsync()) as NotificationPermissionResponse;
  return normalizeNotificationPermission(res);
}

export async function requestNotificationPermission(): Promise<{
  status: NotificationPermissionStatus;
  canAskAgain: boolean;
}> {
  const Notifications = loadNotificationsModule();
  if (!Notifications?.requestPermissionsAsync) {
    return { status: 'undetermined', canAskAgain: false };
  }

  const res =
    (await Notifications.requestPermissionsAsync()) as NotificationPermissionResponse;
  return normalizeNotificationPermission(res);
}

export function isNotificationsModuleAvailable(): boolean {
  return loadNotificationsModule()?.getPermissionsAsync != null;
}
