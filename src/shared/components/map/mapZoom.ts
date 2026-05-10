import type { Region } from 'react-native-maps';

/** Convierte nivel de zoom numérico a latitude/longitude delta (aprox. Web Mercator). */
export const zoomToDelta = (zoom: number): number =>
  Math.exp(Math.log(360) - zoom * Math.LN2);

export const zoomToRegion = (
  latitude: number,
  longitude: number,
  zoom: number,
): Region => {
  const delta = zoomToDelta(zoom);
  return {
    latitude,
    longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
};
