import { useEffect, useRef } from 'react';
import { useActiveSessionStore } from './store/useActiveSessionStore';
import { useSessionStore } from './store/useSessionStore';
import { replaceToRoute } from '../../presentation/routes/navigationRef';
import { useAuthStore } from '../auth/store/userAuthStore';

/**
 * Ejecuta la hidratación de sesión activa desde el backend y, si existe,
 * sincroniza el store de sesión y navega a la pantalla de carga.
 * Conectar WebSocket y join-session lo hace SessionChargeScreen al tener
 * chargingData.sessionId (que se rellena aquí).
 *
 * Usar una sola vez en el árbol de componentes cuando el usuario está autenticado
 * (p. ej. dentro de DrawerHome o del stack principal post-login).
 */
export function useSessionRestore() {
  const hydrateFromBackend = useActiveSessionStore(s => s.hydrateFromBackend);
  const setChargingData = useSessionStore(s => s.setChargingData);
  const setIsCharging = useSessionStore(s => s.setIsCharging);
  const hasRestoredRef = useRef(false);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const apiStatus = useAuthStore(s => s.apiStatus);

  // Restauración authoritative: navegar SOLO tras respuesta del backend.
  useEffect(() => {
    if (isAuthenticated !== 'authenticated') return;
    if (apiStatus !== 'reachable') return;
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    let cancelled = false;
    const run = async () => {
      const res = await hydrateFromBackend();
      if (cancelled) return;

      if (res.type === 'ACTIVE_SESSION') {
        setChargingData({
          sessionId: res.session.id,
          status: res.session.status as 'CHARGING' | 'STOPPING',
          startedAt: res.session.startedAt ?? undefined,
        });
        setIsCharging(true);
        replaceToRoute('Session', { screen: 'Sesión' });
        return;
      }

      if (res.type === 'NO_SESSION') {
        // Volver al inicio normal; el flujo global maneja Offline/Auth/Error.
        replaceToRoute('App');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    isAuthenticated,
    apiStatus,
    hydrateFromBackend,
    setChargingData,
    setIsCharging,
  ]);
}
