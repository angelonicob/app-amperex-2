import type { ActiveSession } from './session';
import { activeSessionToChargingData } from './activeSessionToChargingData';
import { useSessionStore } from './store/useSessionStore';
import type { RestoreResult } from './store/useActiveSessionStore';
import { replaceToRoute } from '../../presentation/routes/navigationRef';
import { useAuthStore } from '../auth/store/userAuthStore';

export function isRestorableActiveSession(
  session: ActiveSession | null | undefined,
): session is ActiveSession {
  if (!session?.id) return false;
  return session.status === 'CHARGING' || session.status === 'STOPPING';
}

export function applyActiveSessionToChargingStore(session: ActiveSession): void {
  useSessionStore.getState().setChargingData(activeSessionToChargingData(session));
  useSessionStore.getState().setIsCharging(true);
}

export function applyRestoreResultToStores(res: RestoreResult): void {
  if (res.type === 'ACTIVE_SESSION') {
    applyActiveSessionToChargingStore(res.session);
  }
}

export function navigateForRestoreResult(res: RestoreResult): void {
  switch (res.type) {
    case 'ACTIVE_SESSION':
      applyRestoreResultToStores(res);
      replaceToRoute('Session', { screen: 'Sesión' });
      break;
    case 'NO_SESSION':
      replaceToRoute('App');
      break;
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
      replaceToRoute('App');
  }
}
