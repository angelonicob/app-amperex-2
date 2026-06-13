import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ActiveSession, ActiveSessionResponse } from '../session';
import { getActiveSession } from '../session';
import { secureStorageAdapter } from '../../../infrastructure/storage/secureStorage';
import { isRestorableActiveSession } from '../sessionRestoreUtils';

const STORAGE_KEY = 'amperex-active-session';

export type RestoreState = 'loading' | 'revalidating' | 'done';

export type RestoreResult =
  | { type: 'ACTIVE_SESSION'; session: ActiveSession }
  | { type: 'NO_SESSION' }
  | { type: 'UNAUTHORIZED' }
  | { type: 'OFFLINE' }
  | { type: 'ERROR' };

export interface ActiveSessionState {
  /** Sesión activa restaurada (GET /session/active). Null si no hay o tras clear. */
  activeSession: ActiveSession | null;
  /**
   * Estado de restauración (runtime; NO persistido).
   * - loading: bloquea UI (sin cache usable).
   * - revalidating: hay snapshot local; GET en background.
   * - done: hidratación terminada.
   */
  restoreState: RestoreState;
  setSession: (response: ActiveSessionResponse) => void;
  clearActiveSession: () => void;
  /**
   * Comprueba en backend si hay sesión activa.
   * Con `silent: true` y cache CHARGING/STOPPING no pasa a loading (solo revalidating).
   */
  hydrateFromBackend: (options?: { silent?: boolean }) => Promise<RestoreResult>;
}

export const useActiveSessionStore = create<ActiveSessionState>()(
  persist(
    set => ({
      activeSession: null,
      restoreState: 'loading',

      setSession: (response: ActiveSessionResponse) => {
        set({ activeSession: response.session });
      },

      clearActiveSession: () => {
        set({ activeSession: null, restoreState: 'done' });
      },

      hydrateFromBackend: async (options?: { silent?: boolean }) => {
        const cached = useActiveSessionStore.getState().activeSession;
        const silent =
          options?.silent === true && isRestorableActiveSession(cached);

        set({
          restoreState: silent ? 'revalidating' : 'loading',
        });

        try {
          const res = await getActiveSession();
          if (res?.session) {
            set({ activeSession: res.session, restoreState: 'done' });
            return { type: 'ACTIVE_SESSION', session: res.session };
          }
          set({ activeSession: null, restoreState: 'done' });
          return { type: 'NO_SESSION' };
        } catch (e: any) {
          const status = e?.response?.status;
          if (status === 401 || status === 403) {
            set({ restoreState: 'done' });
            return { type: 'UNAUTHORIZED' };
          }
          if (!e?.response) {
            set({ restoreState: 'done' });
            return { type: 'OFFLINE' };
          }
          set({ restoreState: 'done' });
          return { type: 'ERROR' };
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: state => ({
        activeSession: state.activeSession,
      }),
      onRehydrateStorage: () => state => {
        if (isRestorableActiveSession(state?.activeSession)) {
          state!.restoreState = 'revalidating';
        }
      },
    },
  ),
);
