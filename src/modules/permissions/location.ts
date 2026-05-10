import * as Location from 'expo-location';
import type { LocationPermissionStatus } from './types';

/**
 * Obtiene el estado actual del permiso de ubicación en primer plano.
 */
export async function getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status as LocationPermissionStatus;
}

/**
 * Obtiene estado + canAskAgain para mapear a PermissionState (requestable vs blocked).
 */
export async function getLocationPermissionDetail(): Promise<{
  status: LocationPermissionStatus;
  canAskAgain: boolean;
}> {
  const res = await Location.getForegroundPermissionsAsync();
  return {
    status: res.status as LocationPermissionStatus,
    canAskAgain: res.canAskAgain ?? false,
  };
}

/**
 * Solicita el permiso de ubicación en primer plano.
 * Muestra el diálogo del sistema. Devuelve el estado resultante.
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status as LocationPermissionStatus;
}
