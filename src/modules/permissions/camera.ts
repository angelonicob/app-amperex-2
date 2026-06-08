import { Camera } from 'expo-camera';
import type { CameraPermissionStatus } from './types';

/** Obtiene el estado actual del permiso de cámara (expo-camera). */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  const { status } = await Camera.getCameraPermissionsAsync();
  return status as CameraPermissionStatus;
}

/** Obtiene estado + canAskAgain para mapear a PermissionState. */
export async function getCameraPermissionDetail(): Promise<{
  status: CameraPermissionStatus;
  canAskAgain: boolean;
}> {
  const res = await Camera.getCameraPermissionsAsync();
  return {
    status: res.status as CameraPermissionStatus,
    canAskAgain: res.canAskAgain ?? false,
  };
}

/** Solicita el permiso de cámara y devuelve el estado resultante. */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status as CameraPermissionStatus;
}
