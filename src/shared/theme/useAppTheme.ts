import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from './store/useThemeStore';
import { lightColors, darkColors, AppThemeColors } from './config/colors';

export type AppTheme = AppThemeColors & { isDark: boolean };

export function useAppTheme(): AppTheme {
  const systemScheme = useColorScheme();
  const { themeMode } = useThemeStore();

  return useMemo(() => {
    const isDark =
      themeMode === 'dark' ||
      (themeMode === 'system' && systemScheme === 'dark');
    const colors = isDark ? darkColors : lightColors;
    return { ...colors, isDark };
  }, [themeMode, systemScheme]);
}
