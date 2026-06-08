import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

function isValidCoords(coords: Location.LocationObjectCoords): boolean {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    !(coords.latitude === 0 && coords.longitude === 0)
  );
}

/**
 * Ubicación del usuario para el mapa: reanuda al enfocar la pantalla y al volver
 * la app a primer plano (p. ej. tras una sesión de carga en otra pantalla).
 */
export function useMapUserLocation(enabled: boolean) {
  const isFocused = useIsFocused();
  const [userLocation, setUserLocation] = useState<MapCoordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const activeRef = useRef(false);

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    activeRef.current = false;
  }, []);

  const applyCoords = useCallback((coords: Location.LocationObjectCoords) => {
    if (!isValidCoords(coords)) return;
    setUserLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  }, []);

  const fetchLocation = useCallback(async (): Promise<MapCoordinates | null> => {
    if (!enabled) {
      setUserLocation(null);
      return null;
    }

    setIsLocating(true);
    let fallback: MapCoordinates | null = null;
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setUserLocation(null);
        return null;
      }

      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords && isValidCoords(last.coords)) {
        applyCoords(last.coords);
        fallback = {
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        };
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!isValidCoords(current.coords)) {
        return fallback;
      }
      applyCoords(current.coords);
      return {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
    } catch {
      return fallback;
    } finally {
      setIsLocating(false);
    }
  }, [enabled, applyCoords]);

  const startWatching = useCallback(async () => {
    if (!enabled || !isFocused) return;

    stopWatching();
    activeRef.current = true;

    await fetchLocation();
    if (!activeRef.current) return;

    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 4000,
        },
        ({ coords }) => applyCoords(coords),
      );
    } catch {
      /* seguimiento continuo no disponible; el punto de una lectura sigue válido */
    }
  }, [enabled, isFocused, stopWatching, fetchLocation, applyCoords]);

  useEffect(() => {
    if (!enabled || !isFocused) {
      stopWatching();
      if (!enabled) setUserLocation(null);
      return;
    }

    void startWatching();
    return stopWatching;
  }, [enabled, isFocused, startWatching, stopWatching]);

  useEffect(() => {
    if (!enabled || !isFocused) return;

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') void startWatching();
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [enabled, isFocused, startWatching]);

  const refreshUserLocation = useCallback(async (): Promise<MapCoordinates | null> => {
    if (!enabled) return null;
    return fetchLocation();
  }, [enabled, fetchLocation]);

  return {
    userLocation,
    isLocating,
    refreshUserLocation,
  };
}
