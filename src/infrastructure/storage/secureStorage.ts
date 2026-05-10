import * as SecureStore from 'expo-secure-store';

/**
 * Adaptador de almacenamiento seguro para Zustand persist.
 * Usa expo-secure-store (async). Compatible con createJSONStorage de zustand/middleware.
 */
export const secureStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};
