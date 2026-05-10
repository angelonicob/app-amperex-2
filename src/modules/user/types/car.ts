export interface Car {
  id: string;
  plate: string;
  brand: string;
  model: string;
  variant: {
    id: string;
    name: string;
    yearFrom: number;
    yearTo: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CarCreate {
  vehicleId: string;
  plate: string;
}
