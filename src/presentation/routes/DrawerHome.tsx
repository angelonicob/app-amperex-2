import {
    createDrawerNavigator,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import React from 'react';
import {
    Button,
    Drawer,
    DrawerItem,
    IndexPath,
    Layout,
    Text,
    useTheme,
} from '@ui-kitten/components';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { replaceToRoute } from './navigationRef';
import type { DrawerHomeParams } from './navigationParams';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAuthStore } from '../../modules/auth/store/userAuthStore';
import { useUserStore } from '../../modules/user/store/useUserStore';
import { getDisplayName } from '../../shared/utils/displayName';
import { AvatarInitial } from '../../shared/components/AvatarInitial';
import { useSessionRestore } from '../../modules/session/useSessionRestore';
import { BottomTabHome } from './BottomTabHome';
import { StackCar } from './StackCar';
import { StackProfile } from './StackProfile';
import { StackReservation } from './StackReservation';
import { HistoryScreen } from '../screens/session/HistoryScreen';
import { TarjetasScreen } from '../screens/payments/TarjetasScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { useActiveSessionStore } from '../../modules/session/store/useActiveSessionStore';
const { Navigator, Screen } = createDrawerNavigator<DrawerHomeParams>();

/** Rutas que aparecen en el menú lateral (sin Perfil; el perfil se abre desde el header). */
const DRAWER_MENU_ROUTES: (keyof DrawerHomeParams)[] = [
  'Home',
  'Reservas',
  'Autos',
  'Historial',
  'Tarjetas',
  'Settings',
];

const HomeContent = () => (
  <View style={styles.homeFullScreen}>
    <BottomTabHome />
  </View>
);

const DrawerContent = ({ navigation, state }: DrawerContentComponentProps) => {
  const theme = useTheme();
  const { logout } = useAuthStore();
  const { user } = useUserStore();

  const handleLogout = () => {
    logout();
    replaceToRoute('Auth');
  };

  const handleSelect = (index: IndexPath) => {
    const route = DRAWER_MENU_ROUTES[index.row];
    if (route) {
      navigation.navigate(route);
    }
  };

  const activeRouteName = state.routeNames[state.index];
  const menuRow = DRAWER_MENU_ROUTES.indexOf(
    activeRouteName as keyof DrawerHomeParams,
  );
  const drawerSelectedIndex =
    menuRow >= 0 ? new IndexPath(menuRow) : new IndexPath(0);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme['background-basic-color-1'] },
      ]}
      edges={['top', 'bottom']}
    >
      <Layout
        style={[
          styles.drawerHeader,
          { backgroundColor: theme['background-basic-color-1'] },
        ]}
      >
        <AvatarInitial
          name={user ? getDisplayName(user) : 'Usuario'}
          size={56}
          style={styles.avatar}
        />
        <Text
          category="h5"
          style={[styles.headerTitle, { color: theme['text-basic-color'] }]}
        >
          ¡Hola {user?.firstName?.trim() || 'Usuario'}!
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Perfil')}
          accessibilityRole="link"
          accessibilityLabel="Ir al perfil"
          hitSlop={8}
        >
          <Text
            category="c1"
            style={[
              styles.profileLink,
              { color: theme['color-primary-500'] },
            ]}
          >
            Ver perfil
          </Text>
        </Pressable>
      </Layout>
      <View style={styles.drawerBody}>
        <Drawer
          style={styles.drawer}
          selectedIndex={drawerSelectedIndex}
          onSelect={handleSelect}
        >
          <DrawerItem title="Inicio" />
          <DrawerItem title="Reservas" />
          <DrawerItem title="Autos" />
          <DrawerItem title="Historial" />
          <DrawerItem title="Tarjetas" />
          <DrawerItem title="Configuración" />
        </Drawer>
        <Layout style={styles.logoutFooter}>
          <Button
            appearance="ghost"
            status="danger"
            onPress={handleLogout}
          >
            Cerrar Sesión
          </Button>
        </Layout>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeFullScreen: {
    flex: 1,
  },
  drawerHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileLink: {
    marginTop: 10,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
  },
  drawerBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  drawer: {
    flex: 1,
  },
  logoutFooter: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
});

export const DrawerHome = () => {
  const theme = useTheme();
  useSessionRestore();
  const restoreState = useActiveSessionStore(s => s.restoreState);

  // Gate: evita flicker/carreras mientras se valida /mobile/session/active.
  if (restoreState === 'loading') {
    return <LoadingScreen />;
  }

  // Colores del header basados en el tema
  const headerBackgroundColor = theme['background-basic-color-1'];
  const headerTintColor = theme['text-basic-color'];
  const headerTitleColor = theme['text-basic-color'];

  return (
    <Navigator
      drawerContent={props => <DrawerContent {...props} />}
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: headerBackgroundColor,
        },
        headerTintColor: headerTintColor,
        headerTitleStyle: {
          color: headerTitleColor,
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      <Screen
        name="Home"
        component={HomeContent}
        options={{ headerShown: false }}
      />
      <Screen name="Reservas" component={StackReservation} />
      <Screen name="Autos" component={StackCar} />
      <Screen name="Perfil" component={StackProfile} />
      <Screen name="Historial" component={HistoryScreen} />
      <Screen
        name="Tarjetas"
        component={TarjetasScreen}
        options={{ title: 'Tarjetas' }}
      />
      <Screen name="Settings" component={SettingsScreen} />
    </Navigator>
  );
};
