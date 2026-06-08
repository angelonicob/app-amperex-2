import {
    createDrawerNavigator,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Drawer,
    DrawerItem,
    IndexPath,
    Layout,
    Text,
    useTheme,
} from '@ui-kitten/components';
import { createKittenFa6Icon, type Fa6IconStyle } from '../../shared/components/icons/createKittenFa6Icon';
import type { ImageProps } from 'react-native';
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
import {
  getPendingPayments,
  type PendingPaymentSession,
} from '../../modules/session/pendingPayment';
import { PendingPaymentGateModal } from '../../shared/components/ui/popup/PendingPaymentGateModal';
import { navigateToSessionCompletion } from '../../shared/utils/navigateToSessionCompletion';
const { Navigator, Screen } = createDrawerNavigator<DrawerHomeParams>();

type DrawerMenuItem = {
  route: keyof DrawerHomeParams;
  title: string;
  icon: string;
  iconStyle?: 'solid' | 'regular' | 'brand';
};

/** Rutas que aparecen en el menú lateral (sin Perfil; el perfil se abre desde el header). */
/** Sangría del icono y título; la barra de selección queda a ancho completo a la izquierda. */
const DRAWER_ITEM_CONTENT_INSET = 28;

function drawerItemAccessoryLeft(icon: string, iconStyle?: Fa6IconStyle) {
  const IconComponent = createKittenFa6Icon(icon, iconStyle);
  return (props?: Partial<ImageProps>) => (
    <View style={styles.drawerItemIconWrap}>
      <IconComponent {...props} />
    </View>
  );
}

const DRAWER_MENU_ITEMS: DrawerMenuItem[] = [
  { route: 'Home', title: 'Inicio', icon: 'house' },
  { route: 'Reservas', title: 'Reservas', icon: 'calendar-days' },
  { route: 'Autos', title: 'Autos', icon: 'car' },
  { route: 'Historial', title: 'Historial', icon: 'clock-rotate-left' },
  { route: 'Tarjetas', title: 'Tarjetas', icon: 'credit-card' },
  { route: 'Settings', title: 'Configuración', icon: 'gear' },
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
    const item = DRAWER_MENU_ITEMS[index.row];
    if (item) {
      navigation.navigate(item.route);
    }
  };

  const activeRouteName = state.routeNames[state.index];
  const menuRow = DRAWER_MENU_ITEMS.findIndex(item => item.route === activeRouteName);
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
          {DRAWER_MENU_ITEMS.map(item => (
            <DrawerItem
              key={item.route}
              style={styles.drawerItem}
              title={item.title}
              accessoryLeft={drawerItemAccessoryLeft(item.icon, item.iconStyle)}
            />
          ))}
        </Drawer>
        <Layout style={styles.logoutFooter}>
          <Button
            appearance="ghost"
            status="danger"
            accessoryLeft={createKittenFa6Icon('right-from-bracket')}
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
  drawerItem: {
    paddingHorizontal: 0,
  },
  drawerItemIconWrap: {
    marginLeft: DRAWER_ITEM_CONTENT_INSET,
  },
  logoutFooter: {
    paddingBottom: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export const DrawerHome = () => {
  const theme = useTheme();
  useSessionRestore();
  const restoreState = useActiveSessionStore(s => s.restoreState);
  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [oldestDebt, setOldestDebt] = useState<PendingPaymentSession | null>(null);

  useEffect(() => {
    if (restoreState !== 'done') return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await getPendingPayments();
        if (cancelled || !res.hasDebt || !res.oldest) return;
        setOldestDebt(res.oldest);
        setDebtModalVisible(true);
      } catch {
        // Sin bloquear el drawer si falla el chequeo de deuda
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restoreState]);

  const handlePayDebtFromModal = useCallback(async () => {
    if (!oldestDebt?.sessionId) return;
    setDebtModalVisible(false);
    try {
      await navigateToSessionCompletion(oldestDebt.sessionId);
    } catch {
      setDebtModalVisible(true);
    }
  }, [oldestDebt?.sessionId]);

  // Mientras no termine GET /session/active (o error controlado), no mostrar el drawer.
  if (restoreState !== 'done') {
    return <LoadingScreen />;
  }

  // Colores del header basados en el tema
  const headerBackgroundColor = theme['background-basic-color-1'];
  const headerTintColor = theme['text-basic-color'];
  const headerTitleColor = theme['text-basic-color'];

  return (
    <>
    <PendingPaymentGateModal
      visible={debtModalVisible}
      oldest={oldestDebt}
      onDismiss={() => setDebtModalVisible(false)}
      onPayNow={() => void handlePayDebtFromModal()}
    />
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
      <Screen
        name="Reservas"
        component={StackReservation}
        options={{ title: 'Tus Reservas' }}
      />
      <Screen
        name="Autos"
        component={StackCar}
        options={{ title: 'Tus Vehículos' }}
      />
      <Screen
        name="Perfil"
        component={StackProfile}
        options={{ title: 'Perfil' }}
      />
      <Screen name="Historial" component={HistoryScreen} />
      <Screen
        name="Tarjetas"
        component={TarjetasScreen}
        options={{ title: 'Tarjetas' }}
      />
      <Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configuración' }}
      />
    </Navigator>
    </>
  );
};
