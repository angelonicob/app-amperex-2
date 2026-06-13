import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useColorScheme, StatusBar } from 'react-native';
import { useEffect, useMemo } from 'react';
import {
  flushPendingDeepLinks,
  handleIncomingDeepLink,
} from './src/presentation/routes/deepLinks';
import {
  applySystemChrome,
  getKittenScreenBackground,
  getStatusBarStyle,
} from './src/shared/theme/systemChrome';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { setupApiAuth } from './src/infrastructure/http/setupApiAuth';
import { configurePushNotificationHandler } from './src/modules/notifications/push';
import { PermissionsProvider } from './src/modules/permissions/PermissionsProvider';
import {
  flushPendingNavigation,
  navigationRef,
} from './src/presentation/routes/navigationRef';
import { StackRoot } from './src/presentation/routes/StackRoot';
import { AuthProvider } from './src/presentation/providers/AuthProvider';
import { ReservationConfirmModal } from './src/shared/components/reservation/ReservationConfirmModal';
import { useThemeStore } from './src/shared/theme/store/useThemeStore';
import { FontAwesome6IconsPack } from './src/shared/components/icons/FontAwesome6IconsPack';
import {
  customLightTheme,
  customDarkTheme,
} from './src/shared/theme/themes/customTheme';

setupApiAuth();
configurePushNotificationHandler();

export default function App() {
  const loadThemeFromStorage = useThemeStore(state => state.loadThemeFromStorage);
  const themeMode = useThemeStore(state => state.themeMode);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    loadThemeFromStorage();
  }, [loadThemeFromStorage]);

  const colorScheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme ?? 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const baseTheme = colorScheme === 'dark' ? eva.dark : eva.light;
  const customTheme =
    colorScheme === 'dark' ? customDarkTheme : customLightTheme;
  const theme = { ...baseTheme, ...customTheme };
  const backgroundColor = getKittenScreenBackground(theme);
  const statusBarStyle = getStatusBarStyle(colorScheme === 'dark');

  useEffect(() => {
    applySystemChrome(backgroundColor, statusBarStyle);
  }, [backgroundColor, statusBarStyle]);

  /**
   * Deep links globales (p. ej. `amperex://password-reset/success`).
   * El handler decide qué pantalla abrir y hace `reset` en la pila para evitar que
   * `LoadingGateScreen` la sobrescriba. Listeners de flujo (OneClick) siguen siendo locales.
   */
  useEffect(() => {
    let cancelled = false;
    void Linking.getInitialURL().then(url => {
      if (cancelled || !url) return;
      handleIncomingDeepLink(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleIncomingDeepLink(url);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <IconRegistry icons={FontAwesome6IconsPack} />
        <ApplicationProvider {...eva} theme={theme}>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={backgroundColor}
          translucent={false}
        />
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            flushPendingNavigation();
            flushPendingDeepLinks();
          }}
          theme={{
            dark: colorScheme === 'dark',
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' as const },
              medium: { fontFamily: 'System', fontWeight: '500' as const },
              bold: { fontFamily: 'System', fontWeight: '700' as const },
              heavy: { fontFamily: 'System', fontWeight: '800' as const },
            },
            colors: {
              primary: theme['color-primary-500'],
              background: backgroundColor,
              card: backgroundColor,
              text: theme['text-basic-color'] ?? theme['color-basic-800'],
              border: theme['border-basic-color-3'] ?? theme['color-basic-300'],
              notification: theme['color-primary-500'],
            },
          }}
        >
          <PermissionsProvider>
            <AuthProvider>
              <StackRoot />
              <ReservationConfirmModal />
            </AuthProvider>
          </PermissionsProvider>
        </NavigationContainer>
        </ApplicationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
