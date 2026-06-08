import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'amperex-mobile-device-id';

let cachedDeviceId: string | null = null;

/**
 * ID estable por instalación de la app (SecureStore).
 * El backend lo usa para una sola sesión de carga activa por dispositivo.
 */
export async function getMobileDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const existing = await SecureStore.getItemAsync(STORAGE_KEY);
  if (existing?.trim()) {
    cachedDeviceId = existing.trim();
    return cachedDeviceId;
  }

  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(STORAGE_KEY, id);
  cachedDeviceId = id;
  return id;
}
