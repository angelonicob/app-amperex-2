import {
  useActiveSessionStore,
  type RestoreResult,
} from './store/useActiveSessionStore';
import { useSessionStore } from './store/useSessionStore';
import {
  applyActiveSessionToChargingStore,
  isRestorableActiveSession,
} from './sessionRestoreUtils';

let hydratedThisLaunch = false;

export function wasSessionHydratedThisLaunch(): boolean {
  return hydratedThisLaunch;
}

export function resetSessionHydrationFlag(): void {
  hydratedThisLaunch = false;
}

export function markSessionHydratedThisLaunch(): void {
  hydratedThisLaunch = true;
}

export function waitForActiveSessionStoreHydration(): Promise<void> {
  return new Promise(resolve => {
    const { persist } = useActiveSessionStore;
    if (persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/**
 * Hidrata sesión activa al arranque (cold start).
 * Si hay cache persistido CHARGING/STOPPING, pre-rellena el store sin bloquear la UI.
 */
export async function bootstrapActiveSession(): Promise<RestoreResult> {
  await waitForActiveSessionStoreHydration();

  const cached = useActiveSessionStore.getState().activeSession;
  const hasCache = isRestorableActiveSession(cached);

  if (hasCache) {
    applyActiveSessionToChargingStore(cached);
  }

  const res = await useActiveSessionStore
    .getState()
    .hydrateFromBackend({ silent: hasCache });

  if (res.type === 'ACTIVE_SESSION') {
    applyActiveSessionToChargingStore(res.session);
  } else if (res.type === 'NO_SESSION' && hasCache) {
    useSessionStore.getState().clearSession();
  }

  markSessionHydratedThisLaunch();
  return res;
}
