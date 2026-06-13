import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';

export type MapCoordinates = {
  latitude: number;
  longitude: number;
};

/** Última posición conocida entre montajes / pérdidas de foco del mapa. */
let cachedMapUserLocation: MapCoordinates | null = null;

function isValidCoords(coords: Location.LocationObjectCoords): boolean {
  return (
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude) &&
    !(coords.latitude === 0 && coords.longitude === 0)
  );
}

function toMapCoords(
  coords: Location.LocationObjectCoords,
): MapCoordinates | null {
  if (!isValidCoords(coords)) return null;
  return { latitude: coords.latitude, longitude: coords.longitude };
}

export function readCachedMapUserLocation(): MapCoordinates | null {
  return cachedMapUserLocation;
}

/**
 * Ubicación del usuario para el mapa: reanuda al enfocar la pantalla y al volver
 * la app a primer plano (p. ej. tras una sesión de carga en otra pantalla).
 */
export function useMapUserLocation(enabled: boolean) {
  const isFocused = useIsFocused();
  const [userLocation, setUserLocation] = useState<MapCoordinates | null>(
    () => (enabled ? cachedMapUserLocation : null),
  );
  const [isLocating, setIsLocating] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const activeRef = useRef(false);
  const userLocationRef = useRef<MapCoordinates | null>(userLocation);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    activeRef.current = false;
  }, []);

  const applyCoords = useCallback((coords: Location.LocationObjectCoords) => {
    const next = toMapCoords(coords);
    if (!next) return;
    cachedMapUserLocation = next;
    setUserLocation(next);
  }, []);

  const readLastKnown = useCallback(async (): Promise<MapCoordinates | null> => {
    if (!enabled) return null;
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) {
        const mapped = toMapCoords(last.coords);
        if (mapped) {
          cachedMapUserLocation = mapped;
          setUserLocation(mapped);
          return mapped;
        }
      }
    } catch {
      /* ignorar */
    }
    return userLocationRef.current ?? cachedMapUserLocation;
  }, [enabled]);

  const fetchLocation = useCallback(
    async (opts?: { precise?: boolean }): Promise<MapCoordinates | null> => {
      if (!enabled) {
        setUserLocation(null);
        cachedMapUserLocation = null;
        return null;
      }

      const precise = opts?.precise !== false;
      setIsLocating(true);
      let fallback: MapCoordinates | null =
        userLocationRef.current ?? cachedMapUserLocation;

      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setUserLocation(null);
          cachedMapUserLocation = null;
          return null;
        }

        const lastKnown = await readLastKnown();
        if (lastKnown) {
          fallback = lastKnown;
        }

        if (!precise) {
          return fallback;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const mapped = toMapCoords(current.coords);
        if (!mapped) {
          return fallback;
        }
        applyCoords(current.coords);
        return mapped;
      } catch {
        return fallback;
      } finally {
        setIsLocating(false);
      }
    },
    [enabled, applyCoords, readLastKnown],
  );

  const startWatching = useCallback(async () => {
    if (!enabled || !isFocused) return;

    stopWatching();
    activeRef.current = true;

    void readLastKnown();
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
  }, [enabled, isFocused, stopWatching, fetchLocation, applyCoords, readLastKnown]);

  useEffect(() => {
    if (!enabled) {
      stopWatching();
      setUserLocation(null);
      return;
    }

    if (!isFocused) {
      stopWatching();
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

  /**
   * Centrado rápido: lastKnown/caché de inmediato; opcionalmente precisa en segundo plano.
   */
  const refreshUserLocation = useCallback(
    async (opts?: {
      precise?: boolean;
    }): Promise<MapCoordinates | null> => {
      if (!enabled) return null;

      const fast = await readLastKnown();
      if (opts?.precise === false) {
        return fast;
      }

      const precise = await fetchLocation({ precise: true });
      return precise ?? fast;
    },
    [enabled, readLastKnown, fetchLocation],
  );

  return {
    userLocation,
    isLocating,
    refreshUserLocation,
  };
}
