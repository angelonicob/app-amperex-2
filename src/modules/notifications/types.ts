export type NotificationType =
  | 'vehicle_variant_request'
  | 'vehicle_variant_created'
  | 'station_error';

export interface NotificationDataVehicleRequest {
  requestId: string;
  userId: string;
  clientId: string;
  brand?: string;
  model?: string;
}

export interface NotificationDataVehicleCreated {
  vehicleVariantId: string;
  requestId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationDataVehicleRequest | NotificationDataVehicleCreated | Record<string, unknown>;
  readAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  data: Notification[];
  total: number;
}
