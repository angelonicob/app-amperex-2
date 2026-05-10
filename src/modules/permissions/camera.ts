import { Camera } from 'expo-camera';
import type { CameraPermissionStatus } from './types';

/** Obtiene el estado actual del permiso de cámara (expo-camera). */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status as CameraPermissionStatus;
}

/** Solicita el permiso de cámara y devuelve el estado resultante. */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status as CameraPermissionStatus;
}
