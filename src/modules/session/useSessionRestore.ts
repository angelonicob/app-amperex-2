import { useEffect, useRef } from 'react';
import { navigationRef } from '../../presentation/routes/navigationRef';
import { useAuthStore } from '../auth/store/userAuthStore';
import { wasSessionHydratedThisLaunch } from './sessionBootstrap';
import {
  applyRestoreResultToStores,
  navigateForRestoreResult,
} from './sessionRestoreUtils';
import { useActiveSessionStore } from './store/useActiveSessionStore';

function rootStackRouteName(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  const s = navigationRef.getRootState();
  if (!s?.routes?.length) return undefined;
  const idx = typeof s.index === 'number' ? s.index : 0;
  return s.routes[idx]?.name as string | undefined;
}

/**
 * Hidrata sesión activa cuando el usuario entra al drawer (p. ej. tras login).
 * El cold start lo resuelve `LoadingGateScreen` con `bootstrapActiveSession`.
 */
export function useSessionRestore() {
  const hydrateFromBackend = useActiveSessionStore(s => s.hydrateFromBackend);
  const hasRestoredRef = useRef(false);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const apiStatus = useAuthStore(s => s.apiStatus);

  useEffect(() => {
    if (isAuthenticated !== 'authenticated') return;
    if (apiStatus !== 'reachable') return;
    if (hasRestoredRef.current) return;
    if (wasSessionHydratedThisLaunch()) {
      hasRestoredRef.current = true;
      return;
    }

    let cancelled = false;
    const run = async () => {
      const cached = useActiveSessionStore.getState().activeSession;
      const res = await hydrateFromBackend({
        silent: cached?.status === 'CHARGING' || cached?.status === 'STOPPING',
      });
      if (cancelled) return;

      if (res.type === 'ACTIVE_SESSION') {
        applyRestoreResultToStores(res);
        if (rootStackRouteName() !== 'Session') {
          navigateForRestoreResult(res);
        }
      } else if (res.type === 'NO_SESSION') {
        if (rootStackRouteName() !== 'App') {
          navigateForRestoreResult(res);
        }
      } else {
        navigateForRestoreResult(res);
      }

      if (!cancelled) {
        hasRestoredRef.current = true;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, apiStatus, hydrateFromBackend]);
}
