import { create } from 'zustand';
import {
  getCameraPermissionStatus,
  requestCameraPermission as requestCamera,
} from '../camera';
import {
  getLocationPermissionDetail,
  requestLocationPermission as requestLocation,
} from '../location';
import type { PermissionState } from '../types';
import {
  toPermissionStateFromCamera,
  toPermissionStateFromLocation,
} from '../types';

export interface PermissionsState {
  /** Estado global del permiso de ubicación. */
  locationStatus: PermissionState;
  /** true mientras se está consultando o solicitando el permiso de ubicación. */
  isCheckingLocation: boolean;
  /** Estado global del permiso de cámara. */
  cameraStatus: PermissionState;
  /** true mientras se está consultando o solicitando el permiso de cámara. */
  isCheckingCamera: boolean;
}

export interface PermissionsActions {
  /** Refresca el estado del permiso de ubicación (p. ej. al volver de ajustes). */
  refreshLocationPermission: () => Promise<void>;
  /** Solicita el permiso de ubicación y actualiza el store. */
  requestLocationPermission: () => Promise<PermissionState>;
  /** Refresca el estado del permiso de cámara (p. ej. al volver de ajustes). */
  refreshCameraPermission: () => Promise<void>;
  /** Solicita el permiso de cámara y actualiza el store. */
  requestCameraPermission: () => Promise<PermissionState>;
}

const initialState: PermissionsState = {
  locationStatus: 'not-determined',
  isCheckingLocation: false,
  cameraStatus: 'not-determined',
  isCheckingCamera: false,
};

export const usePermissionsStore = create<PermissionsState & PermissionsActions>(
  (set) => ({
    ...initialState,

    refreshLocationPermission: async () => {
      set({ isCheckingLocation: true });
      try {
        const detail = await getLocationPermissionDetail();
        const state = toPermissionStateFromLocation(
          detail.status,
          detail.canAskAgain,
        );
        set({ locationStatus: state });
      } finally {
        set({ isCheckingLocation: false });
      }
    },

    requestLocationPermission: async () => {
      set({ isCheckingLocation: true });
      try {
        await requestLocation();
        const detail = await getLocationPermissionDetail();
        const state = toPermissionStateFromLocation(
          detail.status,
          detail.canAskAgain,
        );
        set({ locationStatus: state });
        return state;
      } finally {
        set({ isCheckingLocation: false });
      }
    },

    refreshCameraPermission: async () => {
      set({ isCheckingCamera: true });
      try {
        const status = await getCameraPermissionStatus();
        const state = toPermissionStateFromCamera(status);
        set({ cameraStatus: state });
      } finally {
        set({ isCheckingCamera: false });
      }
    },

    requestCameraPermission: async () => {
      set({ isCheckingCamera: true });
      try {
        await requestCamera();
        const status = await getCameraPermissionStatus();
        const state = toPermissionStateFromCamera(status);
        set({ cameraStatus: state });
        return state;
      } finally {
        set({ isCheckingCamera: false });
      }
    },
  }),
);
