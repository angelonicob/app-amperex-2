import { api } from '../../infrastructure/http/Api';
import { Car, CarCreate } from './types/car';
import { Reservation } from './types/reservation';
import {
    BrandResponse,
    MyVehicleResponse,
    VehiclesMeResponse,
} from '../vehicles/vehicle.responses';
import {
    CarCreateResponse,
    ReservationCreateResponse,
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

// * Reservations

/**
 * Formatea una fecha y hora en formato ISO 8601
 * @param date - Fecha base
 * @param timeString - Hora en formato "HHMM" (ej: "0900", "1800")
 * @returns String en formato ISO 8601 (ej: "2024-12-25T10:00:00Z")
 */
export const formatDateTime = (date: Date, timeString: string): string => {
  const hours = parseInt(timeString.substring(0, 2), 10);
  const minutes = parseInt(timeString.substring(2, 4), 10);

  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);

  return dateTime.toISOString();
};

export const addReservation = async (
  reservation: Reservation,
): Promise<ReservationCreateResponse | null> => {
  try {
    const { data } = await api.post<ReservationCreateResponse>(
      'reserva',
      reservation,
    );
    return data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    return null;
  }
};
