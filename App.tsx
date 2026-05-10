import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Platform, useColorScheme, StatusBar } from 'react-native';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { setupApiAuth } from './src/infrastructure/http/setupApiAuth';
import { PermissionsProvider } from './src/modules/permissions/PermissionsProvider';
import { navigationRef } from './src/presentation/routes/navigationRef';
import { StackRoot } from './src/presentation/routes/StackRoot';
import { AuthProvider } from './src/presentation/providers/AuthProvider';
import { useThemeStore } from './src/shared/theme/store/useThemeStore';
import { FontAwesome6IconsPack } from './src/shared/components/icons/FontAwesome6IconsPack';
import {
  customLightTheme,
  customDarkTheme,
} from './src/shared/theme/themes/customTheme';

setupApiAuth();

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
  const backgroundColor =
    colorScheme === 'dark'
      ? theme['color-basic-800']
      : theme['color-basic-100'];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <IconRegistry icons={FontAwesome6IconsPack} />
      <ApplicationProvider {...eva} theme={theme}>
        <StatusBar
          barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={
            colorScheme === 'dark'
              ? theme['color-basic-800']
              : theme['color-basic-100']
          }
        />
        <NavigationContainer
          ref={navigationRef}
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
              card: theme['color-basic-100'],
              text: theme['color-basic-800'],
              border: theme['color-basic-200'],
              notification: theme['color-primary-500'],
            },
          }}
        >
          <PermissionsProvider>
            <AuthProvider>
              <StackRoot />
            </AuthProvider>
          </PermissionsProvider>
        </NavigationContainer>
      </ApplicationProvider>
    </GestureHandlerRootView>
  );
}
