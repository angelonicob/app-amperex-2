import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const THEME_STORAGE_KEY = 'app_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

async function getStoredThemeMode(): Promise<ThemeMode | null> {
  try {
    const value = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
    return null;
  } catch {
    return null;
  }
}

async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('No se pudo guardar el tema:', e);
  }
}

export interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  /** Carga el tema guardado desde el almacenamiento. Llamar al iniciar la app. */
  loadThemeFromStorage: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>(set => ({
  themeMode: 'system',
  setThemeMode: (mode: ThemeMode) => {
    setStoredThemeMode(mode);
    set({ themeMode: mode });
  },
  loadThemeFromStorage: async () => {
    const stored = await getStoredThemeMode();
    if (stored) set({ themeMode: stored });
  },
}));
