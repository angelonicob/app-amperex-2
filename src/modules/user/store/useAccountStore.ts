import { create } from 'zustand';
import {
  addReservation,
  addVehicle,
  assignVehicle,
  fetchVehicles,
  removeVehicleFromUser,
} from '../account';
import { Car, CarCreate } from '../types/car';
import { Reservation } from '../types/reservation';
import { BrandResponse } from '../../vehicles/vehicle.responses';
import { ReservationCreateResponse } from '../account.responses';

export interface AccountState {
  vehicles: Car[];
  availableVehicles: BrandResponse[];
  reservations: ReservationCreateResponse[];

  fetchVehicles: () => Promise<void>;
  //fetchReservations()

  addVehicle: (car: CarCreate) => Promise<Car | null>;
  assignVehicle: (vehicleId: string, plate: string) => Promise<Car | null>;
  removeVehicle: (vehicleId: string) => Promise<void>;
  addReservation: (
    reservation: Reservation,
  ) => Promise<ReservationCreateResponse | null>;
  //cancelReservation()
}

export const useAccountStore = create<AccountState>()(set => ({
  vehicles: [],
  availableVehicles: [],
  reservations: [],

  fetchVehicles: async () => {
    const { myVehicles, availableVehicles } = await fetchVehicles();
    set({ vehicles: myVehicles, availableVehicles });
  },

  addVehicle: async (car: CarCreate) => {
    const newVehicle = await addVehicle(car);
    if (newVehicle) {
      set({ vehicles: [...useAccountStore.getState().vehicles, newVehicle] });
      console.log(useAccountStore.getState().vehicles);
      return newVehicle;
    }
    return null;
  },

  assignVehicle: async (vehicleId: string, plate: string) => {
    const newVehicle = await assignVehicle(vehicleId, plate);
    if (newVehicle) {
      set({ vehicles: [...useAccountStore.getState().vehicles, newVehicle] });
      return newVehicle;
    }
    return null;
  },

  removeVehicle: async (vehicleId: string) => {
    await removeVehicleFromUser(vehicleId);
    set({
      vehicles: useAccountStore
        .getState()
        .vehicles.filter((v) => v.id !== vehicleId),
    });
  },

  addReservation: async (reservation: Reservation) => {
    const newReservation = await addReservation(reservation);
    if (newReservation) {
      set({
        reservations: [
          ...useAccountStore.getState().reservations,
          newReservation,
        ],
      });
      return newReservation;
    }
    return null;
  },
}));
