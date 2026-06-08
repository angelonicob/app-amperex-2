import { create } from 'zustand';
import {
  addVehicle,
  assignVehicle,
  fetchVehicles,
  removeVehicleFromUser,
} from '../account';
import { Car, CarCreate } from '../types/car';
import { BrandResponse } from '../../vehicles/vehicle.responses';

export interface AccountState {
  vehicles: Car[];
  availableVehicles: BrandResponse[];

  fetchVehicles: () => Promise<void>;
  addVehicle: (car: CarCreate) => Promise<Car | null>;
  assignVehicle: (vehicleId: string, plate: string) => Promise<Car | null>;
  removeVehicle: (vehicleId: string) => Promise<void>;
}

export const useAccountStore = create<AccountState>()(set => ({
  vehicles: [],
  availableVehicles: [],

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
}));
