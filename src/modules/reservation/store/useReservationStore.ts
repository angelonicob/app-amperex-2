import { create } from 'zustand';
import {
  cancelReservation,
  createReservation,
  fetchConnectorAgenda,
  fetchUserReservations,
  getDeviceTimezone,
} from '../reservationApi';
import type {
  ConnectorAgendaResponse,
  CreateReservationPayload,
  UserReservation,
} from '../types';

interface ReservationState {
  activeReservation: UserReservation | null;
  history: UserReservation[];
  loadingList: boolean;
  agenda: ConnectorAgendaResponse | null;
  loadingAgenda: boolean;

  loadReservations: () => Promise<void>;
  loadAgenda: (connectorId: string, date: string) => Promise<void>;
  clearAgenda: () => void;
  createReservation: (payload: CreateReservationPayload) => Promise<UserReservation>;
  cancelActiveOrId: (id: string) => Promise<void>;
  hasActiveReservation: () => boolean;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  activeReservation: null,
  history: [],
  loadingList: false,
  agenda: null,
  loadingAgenda: false,

  hasActiveReservation: () => {
    const a = get().activeReservation;
    if (!a) return false;
    if (a.effectiveStatus !== 'ACTIVE') return false;
    return new Date(a.endAt).getTime() > Date.now();
  },

  loadReservations: async () => {
    set({ loadingList: true });
    try {
      const data = await fetchUserReservations(getDeviceTimezone());
      set({
        activeReservation: data.activa,
        history: data.history ?? [],
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('[reservation] loadReservations failed', err);
      }
    } finally {
      set({ loadingList: false });
    }
  },

  loadAgenda: async (connectorId, date) => {
    set({ loadingAgenda: true, agenda: null });
    try {
      const agenda = await fetchConnectorAgenda(
        connectorId,
        date,
        getDeviceTimezone(),
      );
      set({ agenda });
    } catch (err) {
      if (__DEV__) {
        console.warn('[reservation] loadAgenda failed', err);
      }
      throw err;
    } finally {
      set({ loadingAgenda: false });
    }
  },

  clearAgenda: () => set({ agenda: null }),

  createReservation: async (payload) => {
    const created = await createReservation(payload);
    await get().loadReservations();
    return created;
  },

  cancelActiveOrId: async (id) => {
    await cancelReservation(id);
    await get().loadReservations();
  },
}));
