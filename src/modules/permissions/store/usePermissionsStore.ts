import { create } from 'zustand';
import {
  getCameraPermissionDetail,
  requestCameraPermission as requestCamera,
} from '../camera';
import {
  getLocationPermissionDetail,
  requestLocationPermission as requestLocation,
} from '../location';
import {
  getNotificationPermissionDetail,
  isNotificationsModuleAvailable,
  requestNotificationPermission as requestNotifications,
} from '../notifications';
import type { PermissionState } from '../types';
import {
  toPermissionStateFromCamera,
  toPermissionStateFromLocation,
  toPermissionStateFromNotifications,
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
  /** Estado global del permiso de notificaciones push. */
  notificationStatus: PermissionState;
  /** true mientras se está consultando o solicitando notificaciones. */
  isCheckingNotifications: boolean;
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
  /** Refresca el estado del permiso de notificaciones. */
  refreshNotificationPermission: () => Promise<void>;
  /** Solicita el permiso de notificaciones y actualiza el store. */
  requestNotificationPermission: () => Promise<PermissionState>;
  /** Refresca todos los permisos gestionados por la app. */
  refreshAllPermissions: () => Promise<void>;
}

const initialState: PermissionsState = {
  locationStatus: 'not-determined',
  isCheckingLocation: false,
  cameraStatus: 'not-determined',
  isCheckingCamera: false,
  notificationStatus: 'not-determined',
  isCheckingNotifications: false,
};

export const usePermissionsStore = create<PermissionsState & PermissionsActions>(
  (set, get) => ({
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
        const detail = await getCameraPermissionDetail();
        const state = toPermissionStateFromCamera(
          detail.status,
          detail.canAskAgain,
        );
        set({ cameraStatus: state });
      } finally {
        set({ isCheckingCamera: false });
      }
    },

    requestCameraPermission: async () => {
      set({ isCheckingCamera: true });
      try {
        await requestCamera();
        const detail = await getCameraPermissionDetail();
        const state = toPermissionStateFromCamera(
          detail.status,
          detail.canAskAgain,
        );
        set({ cameraStatus: state });
        return state;
      } finally {
        set({ isCheckingCamera: false });
      }
    },

    refreshNotificationPermission: async () => {
      if (!isNotificationsModuleAvailable()) {
        set({ notificationStatus: 'unavailable' });
        return;
      }
      set({ isCheckingNotifications: true });
      try {
        const detail = await getNotificationPermissionDetail();
        const state = toPermissionStateFromNotifications(
          detail.status,
          detail.canAskAgain,
        );
        set({ notificationStatus: state });
      } finally {
        set({ isCheckingNotifications: false });
      }
    },

    requestNotificationPermission: async () => {
      if (!isNotificationsModuleAvailable()) {
        set({ notificationStatus: 'unavailable' });
        return 'unavailable';
      }
      set({ isCheckingNotifications: true });
      try {
        await requestNotifications();
        const detail = await getNotificationPermissionDetail();
        const state = toPermissionStateFromNotifications(
          detail.status,
          detail.canAskAgain,
        );
        set({ notificationStatus: state });
        return state;
      } finally {
        set({ isCheckingNotifications: false });
      }
    },

    refreshAllPermissions: async () => {
      await Promise.all([
        get().refreshLocationPermission(),
        get().refreshCameraPermission(),
        get().refreshNotificationPermission(),
      ]);
    },
  }),
);
