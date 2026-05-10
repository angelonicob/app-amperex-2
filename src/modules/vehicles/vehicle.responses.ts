export interface VariantResponse {
  id: string;
  name: string;
  yearFrom: number;
  yearTo: number;
  vehicleId: string;
}

export interface ModelResponse {
  id: string;
  model: string;
  variants: VariantResponse[];
}

export interface BrandResponse {
  brand: string;
  models: ModelResponse[];
}

export interface MyVehicleResponse {
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
  createdAt: string;
  updatedAt: string;
}

export interface VehiclesMeResponse {
  availableVehicles: BrandResponse[];
  myVehicles: MyVehicleResponse[];
}
