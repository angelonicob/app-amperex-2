import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@ui-kitten/components';
import { useAppTheme } from '../theme/useAppTheme';
import {
  applySystemChrome,
  getKittenScreenBackground,
  getStatusBarStyle,
} from '../theme/systemChrome';

/**
 * Sincroniza status bar y barra de navegación (Android) con `background-basic-color-1`.
 * Usar en pantallas full-screen fuera del drawer/tab (p. ej. flujo Session).
 */
export function useSystemChrome(): string {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const backgroundColor = getKittenScreenBackground(theme);
  const barStyle = getStatusBarStyle(isDark);

  const sync = useCallback(() => {
    applySystemChrome(backgroundColor, barStyle);
  }, [backgroundColor, barStyle]);

  useFocusEffect(
    useCallback(() => {
      sync();
      return undefined;
    }, [sync]),
  );

  return backgroundColor;
}
