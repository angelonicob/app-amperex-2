import { useEffect, useRef } from 'react';
import { useActiveSessionStore } from './store/useActiveSessionStore';
import { useSessionStore } from './store/useSessionStore';
import { navigationRef, replaceToRoute } from '../../presentation/routes/navigationRef';
import { useAuthStore } from '../auth/store/userAuthStore';

function rootStackRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  const s = navigationRef.getRootState();
  if (!s?.routes?.length) return undefined;
  const idx = typeof s.index === 'number' ? s.index : 0;
  return s.routes[idx]?.name as string | undefined;
}

/**
 * Hidrata sesión activa desde GET /mobile/session/active y navega.
 * - CHARGING / STOPPING → `Session` → pantalla `Sesión` (WebSocket se une en SessionChargeScreen).
 * - Sin sesión → `App` (drawer).
 * - Red / 5xx → Offline o BackendError (reintento al volver API y remontar drawer).
 * - 401/403 → Auth (token inválido).
 *
 * Siempre consulta al backend al entrar al drawer autenticado; no confía solo en persistencia.
 */
export function useSessionRestore() {
  const hydrateFromBackend = useActiveSessionStore(s => s.hydrateFromBackend);
  const setChargingData = useSessionStore(s => s.setChargingData);
  const setIsCharging = useSessionStore(s => s.setIsCharging);
  const hasRestoredRef = useRef(false);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const apiStatus = useAuthStore(s => s.apiStatus);

  useEffect(() => {
    if (isAuthenticated !== 'authenticated') return;
    if (apiStatus !== 'reachable') return;
    if (hasRestoredRef.current) return;

    let cancelled = false;
    const run = async () => {
      const res = await hydrateFromBackend();
      if (cancelled) return;

      switch (res.type) {
        case 'ACTIVE_SESSION': {
          setChargingData({
            sessionId: res.session.id,
            status: res.session.status as 'CHARGING' | 'STOPPING',
            startedAt: res.session.startedAt ?? undefined,
            ...(res.session.plannedDepartureAt
              ? { departureTime: res.session.plannedDepartureAt }
              : {}),
          });
          setIsCharging(true);
          replaceToRoute('Session', { screen: 'Sesión' });
          break;
        }
        case 'NO_SESSION': {
          // Ya estamos en App (p. ej. tras login): NO hacer reset — vuelve a montar DrawerHome,
          // resetea hasRestoredRef y re-entra en loading en bucle.
          if (rootStackRouteName() !== 'App') {
            replaceToRoute('App');
          }
          break;
        }
        case 'UNAUTHORIZED':
          useAuthStore.getState().logout();
          replaceToRoute('Auth');
          break;
        case 'OFFLINE':
          replaceToRoute('Offline');
          break;
        case 'ERROR':
          replaceToRoute('BackendError');
          break;
        default:
          if (rootStackRouteName() !== 'App') {
            replaceToRoute('App');
          }
      }

      if (!cancelled) {
        hasRestoredRef.current = true;
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
