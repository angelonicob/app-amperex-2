import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePermissionsStore } from './store/usePermissionsStore';

/**
 * Provider que mantiene actualizado el estado de permisos (store) para el flujo:
 * 1️⃣ not-determined → Disclaimer
 * 2️⃣ requestable → PermissionRequest (pedir permiso)
 * 3️⃣ blocked → PermissionBlocked (abrir configuración)
 * 4️⃣ granted → render normal
 *
 * - Al montar: refresca permisos de ubicación, cámara y notificaciones.
 * - Al volver la app a primer plano: vuelve a refrescar (p. ej. si el usuario
 *   fue a Ajustes y concedió o revocó algún permiso).
 */
export function PermissionsProvider({ children }: PropsWithChildren) {
  const refreshAllPermissions = usePermissionsStore(
    (s) => s.refreshAllPermissions,
  );

  useEffect(() => {
    void refreshAllPermissions();
  }, [refreshAllPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void refreshAllPermissions();
        }
      },
    );
    return () => subscription.remove();
  }, [refreshAllPermissions]);

  return <>{children}</>;
}
