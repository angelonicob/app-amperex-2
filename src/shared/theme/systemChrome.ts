import { Platform, StatusBar, type StatusBarStyle } from 'react-native';
import * as SystemUI from 'expo-system-ui';

/** Fondo de pantalla alineado con `Layout level="1"` de UI Kitten. */
export function getKittenScreenBackground(
  theme: Record<string, string>,
): string {
  return theme['background-basic-color-1'];
}

export function getStatusBarStyle(isDark: boolean): StatusBarStyle {
  return isDark ? 'light-content' : 'dark-content';
}

/** Status bar, raíz Android (edge-to-edge) y barra de navegación del sistema. */
export function applySystemChrome(
  backgroundColor: string,
  barStyle: StatusBarStyle,
): void {
  StatusBar.setBarStyle(barStyle);
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(backgroundColor);
    StatusBar.setTranslucent(false);
  }
  void SystemUI.setBackgroundColorAsync(backgroundColor);
}
