import { useCallback, useEffect, useRef, useState } from 'react';
import { usePermissionsStore } from '../../../modules/permissions/store/usePermissionsStore';
import { registerPushTokenIfGranted } from '../../../modules/notifications/push';
import { PermissionPromptModal } from './PermissionPromptModal';

type NotificationsPermissionPromptProps = {
  /** Drawer listo (sesión restaurada). */
  enabled: boolean;
};

/**
 * Solicita permiso de notificaciones push tras ingresar a la app (una vez por sesión).
 */
export function NotificationsPermissionPrompt({
  enabled,
}: NotificationsPermissionPromptProps) {
  const notificationStatus = usePermissionsStore((s) => s.notificationStatus);
  const requestNotificationPermission = usePermissionsStore(
    (s) => s.requestNotificationPermission,
  );
  const refreshNotificationPermission = usePermissionsStore(
    (s) => s.refreshNotificationPermission,
  );

  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!enabled || dismissedRef.current || promptedRef.current) {
      return;
    }
    if (
      notificationStatus === 'not-determined' ||
      notificationStatus === 'requestable'
    ) {
      promptedRef.current = true;
      setVisible(true);
    }
  }, [enabled, notificationStatus]);

  useEffect(() => {
    if (notificationStatus === 'granted') {
      setVisible(false);
      void registerPushTokenIfGranted();
    }
  }, [notificationStatus]);

  const handleClose = useCallback(() => {
    dismissedRef.current = true;
    setVisible(false);
  }, []);

  const handleRequest = useCallback(async () => {
    const state = await requestNotificationPermission();
    if (state === 'granted') {
      setVisible(false);
      await registerPushTokenIfGranted();
      return;
    }
    if (state === 'blocked') {
      setVisible(false);
    }
  }, [requestNotificationPermission]);

  const handleRefresh = useCallback(async () => {
    await refreshNotificationPermission();
    const state = usePermissionsStore.getState().notificationStatus;
    if (state === 'granted') {
      setVisible(false);
      await registerPushTokenIfGranted();
    }
  }, [refreshNotificationPermission]);

  return (
    <PermissionPromptModal
      visible={visible}
      status={notificationStatus}
      disclaimerTitle="Notificaciones"
      title="Activar notificaciones"
      message="Te avisaremos sobre tus reservas y recordatorios de carga. Puedes cambiar esto en cualquier momento desde Configuración."
      screenName="AmperEX"
      requestButtonText="Activar notificaciones"
      onRequest={handleRequest}
      onRefresh={handleRefresh}
      onClose={handleClose}
    />
  );
}
