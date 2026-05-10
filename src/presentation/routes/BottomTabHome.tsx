import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  BottomNavigation,
  BottomNavigationTab,
  Icon,
  useTheme,
} from '@ui-kitten/components';
import { BottomTabStackParams } from './navigationParams';
import { MapScreen } from '../screens/home/MapScreen';
import { CameraScreen } from '../screens/home/CameraScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { TAB_BAR_OVERLAY_HEIGHT } from '../../shared/constants/layout';

const { Navigator, Screen } = createBottomTabNavigator<BottomTabStackParams>();

const TAB_BAR_RADIUS = 16;
/** Aproximación para separar overlays del contenido del tabbar flotante. */

/** Pantalla vacía: el tab "Menú" solo abre el drawer, no muestra contenido aquí. */
const MenuTabPlaceholder = () => <View style={styles.menuPlaceholder} />;

const QRIconWithCircle = (props: any) => {
  const theme = useTheme();
  const iconSize = props.height || 24;
  const circleSize = iconSize + 16; // Círculo más grande que el ícono

  return (
    <View
      style={[
        styles.iconCircle,
        {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: theme['color-primary-500'],
        },
      ]}
    >
      <Icon
        {...props}
        name="qrcode"
        pack="fontawesome6"
        iconStyle="solid"
        style={[
          props.style,
          {
            tintColor: '#FFFFFF',
          },
        ]}
      />
    </View>
  );
};

const BottomTabBar = ({ navigation, state }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Separación inferior del tabbar flotante (safe area + gesto)
  const bottomOffset = Math.max(insets.bottom, 8) + 10;

  // Calcular posición y ancho del indicador
  const tabCount = state.routeNames.length;
  const tabFullWidth = width / tabCount; // Ancho completo de cada tab
  const indicatorWidth = tabFullWidth * 0.35; // Ancho del indicador (35% del ancho del tab)
  // Centrar el indicador: posición del tab + (ancho del tab - ancho del indicador) / 2
  const indicatorLeft =
    state.index * tabFullWidth + (tabFullWidth - indicatorWidth) / 2;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            borderTopColor: theme['border-basic-color-3'],
            bottom: bottomOffset,
            left: 0,
            right: 0,
            backgroundColor: theme['background-basic-color-1'],
          },
        ]}
      >
        <BottomNavigation
          selectedIndex={state.index}
          onSelect={index => {
            const routeName = state.routeNames[index];
            if (routeName === 'Menu') {
              navigation.getParent()?.dispatch(DrawerActions.openDrawer());
              return;
            }
            navigation.navigate(routeName);
          }}
          style={styles.bottomNavigation}
          appearance="noIndicator"
        >
          <BottomNavigationTab
            title="Mapa"
            icon={props => (
              <Icon {...props} name="map" pack="fontawesome6" iconStyle="brand" />
            )}
          />
          <BottomNavigationTab title="QR" icon={QRIconWithCircle} />
          <BottomNavigationTab
            title="Menú"
            icon={props => (
              <Icon
                {...props}
                name="bars"
                pack="fontawesome6"
                iconStyle="solid"
              />
            )}
          />
        </BottomNavigation>
        {/* Indicador personalizado en la parte inferior */}
        <View style={styles.indicatorContainer}>
          <View
            style={[
              styles.indicator,
              {
                left: indicatorLeft,
                width: indicatorWidth,
                backgroundColor: theme['color-primary-500'],
              },
            ]}
          />
        </View>
      </View>

      {/* Fondo sólido en la zona de gestos/botones para evitar “hueco” transparente.
          Va DESPUÉS para tapar cualquier sombra/elevación que caiga debajo. */}
      <View
        pointerEvents="none"
        style={[
          styles.bottomScrim,
          {
            // +1 para tapar la línea de unión (shadow/border) entre tabbar y zona de gestos.
            height: bottomOffset + 1,
            backgroundColor: theme['background-basic-color-1'],
          },
        ]}
      />
    </>
  );
};

export const BottomTabHome = () => (
  <Navigator
    tabBar={props => <BottomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Screen name="Mapa" component={MapScreen} />
    <Screen name="QR" component={CameraScreen} />
    <Screen name="Menu" component={MenuTabPlaceholder} />
  </Navigator>
);

const styles = StyleSheet.create({
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  container: {
    borderTopWidth: 1,
    borderTopLeftRadius: TAB_BAR_RADIUS,
    borderTopRightRadius: TAB_BAR_RADIUS,
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 2,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    // Android shadow
    elevation: 10,
  },
  bottomNavigation: {
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPlaceholder: {
    flex: 1,
  },
});
