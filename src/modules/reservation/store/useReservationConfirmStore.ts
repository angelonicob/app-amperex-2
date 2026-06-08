import { create } from 'zustand';

interface ReservationConfirmState {
  reservationId: string | null;
  openReservationId: (id: string) => void;
  close: () => void;
}

export const useReservationConfirmStore = create<ReservationConfirmState>(
  (set) => ({
    reservationId: null,
    openReservationId: (id) => set({ reservationId: id }),
    close: () => set({ reservationId: null }),
  }),
);
