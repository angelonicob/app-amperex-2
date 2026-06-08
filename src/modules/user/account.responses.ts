import { Car } from './types/car';

export interface CarCreateResponse {
  car: Car;
}

// Mantener compatibilidad con la estructura antigua si es necesario
export interface CarItemResponse {
  car: Car;
}

export interface CarItemResponse {
  car: Car;
}

export type CarGetResponse = CarItemResponse[];
