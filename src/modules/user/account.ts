import { api } from '../../infrastructure/http/Api';
import { Car, CarCreate } from './types/car';
import {
    BrandResponse,
    MyVehicleResponse,
    VehiclesMeResponse,
} from '../vehicles/vehicle.responses';
import {
    CarCreateResponse,
} from './account.responses';

const mapMyVehicleResponse = (data: MyVehicleResponse): Car => {
  return {
    id: data.id,
    plate: data.plate,
    brand: data.brand,
    model: data.model,
    variant: data.variant,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// * Cars

export const addVehicle = async (car: CarCreate): Promise<Car | null> => {
  try {
    const { data } = await api.post<CarCreateResponse>('car', car);
    if (data && data.car) {
      return data.car;
    }
    return null;
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return null;
  }
};

export const removeVehicleFromUser = async (
  vehicleId: string,
): Promise<void> => {
  try {
    await api.delete(`car/me/${vehicleId}`);
  } catch (e: unknown) {
    const err = e as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };
    const raw = err?.response?.data?.message;
    const msg =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw[0]
          : err?.message ?? 'No se pudo eliminar el vehículo';
    throw new Error(msg);
  }
};

export const assignVehicle = async (
  vehicleId: string,
  plate: string,
): Promise<Car | null> => {
  try {
    const { data } = await api.post<MyVehicleResponse>('car/assign', {
      vehicleId,
      plate,
    });
    if (data) {
      return mapMyVehicleResponse(data);
    }
    return null;
  } catch (error: any) {
    console.error('Error assigning vehicle:', error);
    // Si el error es 400, el vehículo ya está asociado
    if (error?.response?.status === 400) {
      throw new Error('Este vehículo ya está asociado a tu cuenta');
    }
    throw error;
  }
};

export const fetchVehicles = async (): Promise<{
  myVehicles: Car[];
  availableVehicles: BrandResponse[];
}> => {
  try {
    const { data } = await api.get<VehiclesMeResponse>('car/me');
    if (!data) {
      return { myVehicles: [], availableVehicles: [] };
    }

    const myVehicles = (data.myVehicles || []).map(mapMyVehicleResponse);
    const availableVehicles = data.availableVehicles || [];

    return { myVehicles, availableVehicles };
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return { myVehicles: [], availableVehicles: [] };
  }
};
