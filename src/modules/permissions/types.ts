/**
 * Estado global/normalizado del permiso para el store de Zustand.
 * Simplifica los estados nativos en casos de UI.
 */
export type PermissionState =
  | 'granted'
  | 'not-determined'  // primera vez, nunca se ha pedido (pre-permission / disclaimer)
  | 'requestable'     // usuario negó una vez pero canAskAgain = true (se puede volver a pedir)
  | 'blocked'         // usuario lo bloqueó en sistema (ir a ajustes)
  | 'unavailable';    // no disponible en el dispositivo / restricción de política

/** Estado nativo del permiso de ubicación (expo-location). */
export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

/** Estado nativo del permiso de cámara (expo-camera). */
export type CameraPermissionStatus = 'granted' | 'undetermined' | 'denied';

/**
 * Mapea el estado nativo de ubicación (+ canAskAgain) a PermissionState.
 */
export function toPermissionStateFromLocation(
  status: LocationPermissionStatus,
  canAskAgain: boolean,
): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'not-determined';
  if (status === 'denied') return canAskAgain ? 'requestable' : 'blocked';
  return 'unavailable';
}

/** Mapea el estado nativo de cámara (expo-camera) a PermissionState. */
export function toPermissionStateFromCamera(
  status: CameraPermissionStatus,
): PermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'undetermined') return 'not-determined';
  if (status === 'denied') return 'blocked';
  return 'unavailable';
}
