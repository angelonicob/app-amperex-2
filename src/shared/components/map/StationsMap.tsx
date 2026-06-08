import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChargePoint,
  Connector,
  Station,
} from '../../../modules/station/types/station';
import { useStationStore } from '../../../modules/station/store/useStationStore';
import { useStationsWebSocket } from '../../hooks/useStationsWebSocket';
import Icon from '../icons/Icon';
import { CardConnector } from '../ui/card';
import { Text as KittenText, useTheme } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import { useReservationStore } from '../../../modules/reservation/store/useReservationStore';
import { useAccountStore } from '../../../modules/user/store/useAccountStore';
import { runCreateReservationPreflight } from '../../../modules/reservation/createReservationFlow';
import { navigationRef } from '../../../presentation/routes/navigationRef';
import { navigateToSessionCompletion } from '../../utils/navigateToSessionCompletion';
import { useInfoDialog } from '../../hooks/useInfoDialog';
import { GOOGLE_MAP_DARK_STYLE } from './googleMapStyles';
import { zoomToRegion } from './mapZoom';
import { TAB_BAR_OVERLAY_HEIGHT } from '../../constants/layout';
import { useMapUserLocation } from '../../hooks/useMapUserLocation';
import { formatConnectorCode } from '../../utils/connectorDisplay';

const USER_LOCATION_DOT_COLOR = '#1A73E8';
const USER_LOCATION_DOT_BORDER = '#FFFFFF';

const DEFAULT_ZOOM = 14;

const DEFAULT_MAP_CENTER = { latitude: 19.4326, longitude: -99.1332 };

const MAP_FLOATING_BTN_SIZE = 48;
const MAP_FLOATING_BTN_GAP = 8;
/** Grados de tolerancia para considerar el mapa orientado al norte. */
const MAP_NORTH_ALIGNED_THRESHOLD = 1;

function useMapFloatingControlsInsets() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const minSide = Math.min(windowWidth, windowHeight);

  return useMemo(() => {
    const horizontal = Math.max(12, Math.min(24, Math.round(minSide * 0.042)));
    const bottomGap = Math.max(10, Math.min(20, Math.round(minSide * 0.034)));
    const locationBottom = bottomGap + insets.bottom + TAB_BAR_OVERLAY_HEIGHT;
    const right = horizontal + insets.right;
    return {
      right,
      locationBottom,
      compassBottom: locationBottom + MAP_FLOATING_BTN_SIZE + MAP_FLOATING_BTN_GAP,
    };
  }, [insets.bottom, insets.right, minSide]);
}

export interface StationsMapProps {
  hasLocationPermission: boolean;
  /** Se invoca al pulsar "mi ubicación" sin permiso concedido. */
  onMyLocationWithoutPermission?: () => void;
}

export interface StationsMapRef {
  selectStation: (stationId: string) => void;
  centerOnMyLocation: () => Promise<void>;
}

function formatConnectorLabel(connector: Connector): string {
  return formatConnectorCode(connector.connectorType, connector.connectorId);
}

interface StationSheetListProps {
  station: Station;
  colors: ReturnType<typeof useAppTheme>;
  onNavigate: (station: Station) => void;
  onReserve: (connector: Connector, chargePoint: ChargePoint) => void;
}

function StationSheetList({
  station,
  colors,
  onNavigate,
  onReserve,
}: StationSheetListProps) {
  const insets = useSafeAreaInsets();

  const listContentStyle = useMemo(
    () => [
      styles.chargePointsScrollContent,
      { paddingBottom: 24 + insets.bottom + TAB_BAR_OVERLAY_HEIGHT },
    ],
    [insets.bottom],
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={styles.stationHeader}>
        <View style={styles.stationTitleBlock}>
          <Text style={[styles.stationTitle, { color: colors.primary }]}>
            {station.name}
          </Text>
          {station.address?.rawAddress ? (
            <KittenText
              category="c1"
              style={[styles.stationAddress, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {station.address.rawAddress}
            </KittenText>
          ) : null}
          {station.openAt != null && station.closeAt != null ? (
            <KittenText
              category="c1"
              style={[styles.stationHorario, { color: colors.textSecondary }]}
            >
              Horario: {station.openAt} - {station.closeAt}
            </KittenText>
          ) : null}
        </View>
        <Pressable
          onPress={() => onNavigate(station)}
          style={({ pressed }) => [
            styles.navigateButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name="location-arrow" size={14} color={colors.white} />
          <Text style={styles.navigateButtonText}>Navegar</Text>
        </Pressable>
      </View>
    ),
    [station, colors.primary, colors.textSecondary, colors.white, onNavigate],
  );

  const renderChargePoint = useCallback(
    ({ item: chargePoint }: { item: ChargePoint }) => (
      <View style={styles.chargePointBlock}>
        <KittenText category="s2" style={[styles.chargePointLabel, { color: colors.text }]}>
          {chargePoint.name}
        </KittenText>
        <View style={styles.connectorGrid}>
          {chargePoint.connectors.map(connector => (
            <CardConnector
              key={connector.id}
              connector={connector}
              chargePoint={chargePoint}
              onReserve={() => onReserve(connector, chargePoint)}
            />
          ))}
        </View>
      </View>
    ),
    [colors.text, onReserve],
  );

  return (
    <BottomSheetFlatList
      data={station.chargePoints}
      keyExtractor={(item: ChargePoint) => item.id}
      renderItem={renderChargePoint}
      ListHeaderComponent={ListHeaderComponent}
      style={styles.stationList}
      contentContainerStyle={listContentStyle}
      showsVerticalScrollIndicator
      nestedScrollEnabled
    />
  );
}

function StationsMapComponent(
  { hasLocationPermission, onMyLocationWithoutPermission }: StationsMapProps,
  ref: React.Ref<StationsMapRef>,
) {
  const colors = useAppTheme();
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const mapFloatingInsets = useMapFloatingControlsInsets();
  const isFocused = useIsFocused();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [mapHeading, setMapHeading] = useState(0);
  const [markersRevision, setMarkersRevision] = useState(0);

  const { userLocation, isLocating, refreshUserLocation } = useMapUserLocation(
    hasLocationPermission,
  );

  useEffect(() => {
    let cancelled = false;

    const fallbackRegion = () =>
      zoomToRegion(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude, DEFAULT_ZOOM);

    const load = async () => {
      if (!hasLocationPermission) {
        if (!cancelled) setMapRegion(fallbackRegion());
        return;
      }

      const last = await Location.getLastKnownPositionAsync();
      if (!cancelled && last?.coords) {
        const { latitude, longitude } = last.coords;
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          setMapRegion(zoomToRegion(latitude, longitude, DEFAULT_ZOOM));
          return;
        }
      }

      try {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setMapRegion(zoomToRegion(coords.latitude, coords.longitude, DEFAULT_ZOOM));
        }
      } catch {
        if (!cancelled) setMapRegion(fallbackRegion());
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [hasLocationPermission]);

  /** Alineado con la preferencia de la app (no solo el tema del SO). Por defecto MapView usa `system`. */
  const mapUserInterfaceStyle = colors.isDark ? 'dark' : 'light';

  const customMapStyle = useMemo(
    () => (colors.isDark ? GOOGLE_MAP_DARK_STYLE : undefined),
    [colors.isDark],
  );

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [stationsLoaded, setStationsLoaded] = useState(false);

  const { stations, fetchStations, updateConnectorStatus } = useStationStore();
  const { loadReservations } = useReservationStore();
  const fetchVehicles = useAccountStore((s) => s.fetchVehicles);
  const { showInfo, InfoDialog: MapInfoDialog } = useInfoDialog();

  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null;
    return stations.find(s => s.id === selectedStationId) ?? null;
  }, [stations, selectedStationId]);

  useEffect(() => {
    if (stations.length > 0) {
      setStationsLoaded(true);
    }
  }, [stations.length]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadStations = async () => {
        try {
          await fetchStations();
          if (!cancelled) {
            setStationsLoaded(true);
            setMarkersRevision(v => v + 1);
          }
        } catch (error) {
          console.error('Error al cargar estaciones:', error);
        }
      };

      void loadStations();

      return () => {
        cancelled = true;
      };
    }, [fetchStations]),
  );

  const { lastUpdate } = useStationsWebSocket(
    isFocused && (stationsLoaded || stations.length > 0),
  );

  useEffect(() => {
    if (lastUpdate?.type === 'connector-status-updated') {
      updateConnectorStatus({
        stationId: lastUpdate.data.stationId,
        connectorId: lastUpdate.data.connectorId,
        connectorNumber: lastUpdate.data.connectorNumber,
        status: lastUpdate.data.status,
        chargePointId: lastUpdate.data.chargePointId,
        connectionState: lastUpdate.data.connectionState,
        chargePointOperativeStatus: lastUpdate.data.chargePointOperativeStatus,
        connectorOperativeStatus: lastUpdate.data.connectorOperativeStatus,
      });
    }
  }, [lastUpdate, updateConnectorStatus]);

  // Soft-refresh al abrir el bottomsheet en una estación: cubre el caso en que
  // mensajes WS se perdieron durante transiciones de navegación (isFocused gap).
  useEffect(() => {
    if (selectedStationId) {
      void fetchStations();
    }
  }, [selectedStationId, fetchStations]);

  /** Altura aproximada de la barra de búsqueda + notificaciones en MapScreen (insets.top + 8 + ~48). */
  const mapTopBarBottom = insets.top + 56;

  const snapPoints = useMemo(() => ['22%', '50%', '88%'], []);

  const bottomSheetHandle = useMemo(() => {
    const indicatorWidth = Math.min(96, Math.max(52, Math.round(windowWidth * 0.14)));
    return {
      handleStyle: styles.sheetHandle,
      handleIndicatorStyle: {
        width: indicatorWidth,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.isDark ? colors.textDisabled : colors.borderDark,
      },
    };
  }, [colors.borderDark, colors.isDark, colors.textDisabled, windowWidth]);

  useEffect(() => {
    void loadReservations();
    void fetchVehicles();
  }, [loadReservations, fetchVehicles]);

  const animateToStationCoords = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      zoomToRegion(latitude, longitude, DEFAULT_ZOOM),
      350,
    );
  }, []);

  const handleStationMarkerPress = useCallback(
    (station: Station) => {
      setSelectedStationId(station.id);
      animateToStationCoords(parseFloat(station.latitude), parseFloat(station.longitude));
      bottomSheetRef.current?.expand();
    },
    [animateToStationCoords],
  );

  const selectStation = useCallback(
    (stationId: string) => {
      const station = stations.find(s => s.id === stationId);
      if (station) {
        setSelectedStationId(stationId);
        animateToStationCoords(parseFloat(station.latitude), parseFloat(station.longitude));
        bottomSheetRef.current?.expand();
      }
    },
    [stations, animateToStationCoords],
  );

  const handleCenterOnMyLocation = useCallback(async () => {
    if (!hasLocationPermission || isLocating) return;
    const coords = await refreshUserLocation();
    if (coords) {
      animateToStationCoords(coords.latitude, coords.longitude);
    }
  }, [hasLocationPermission, isLocating, refreshUserLocation, animateToStationCoords]);

  useImperativeHandle(ref, () => ({
    selectStation,
    centerOnMyLocation: handleCenterOnMyLocation,
  }), [selectStation, handleCenterOnMyLocation]);

  const handleMyLocationPress = useCallback(() => {
    if (hasLocationPermission) {
      void handleCenterOnMyLocation();
      return;
    }
    onMyLocationWithoutPermission?.();
  }, [hasLocationPermission, handleCenterOnMyLocation, onMyLocationWithoutPermission]);

  const syncMapHeading = useCallback(async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (camera?.heading != null && Number.isFinite(camera.heading)) {
        setMapHeading(camera.heading);
      }
    } catch {
      /* getCamera no disponible en algunas plataformas */
    }
  }, []);

  const handleResetNorth = useCallback(async () => {
    try {
      const camera = await mapRef.current?.getCamera();
      if (!camera) return;
      mapRef.current?.animateCamera(
        {
          center: camera.center,
          heading: 0,
          pitch: 0,
          zoom: camera.zoom,
        },
        { duration: 250 },
      );
      setMapHeading(0);
    } catch {
      /* ignorar */
    }
  }, []);

  const handleNavigateToStation = useCallback((station: Station) => {
    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  }, []);

  const handleReserveConnector = useCallback(
    (connector: Connector, _chargePoint: ChargePoint) => {
      if (!selectedStation) return;

      void (async () => {
        const preflight = await runCreateReservationPreflight();
        if (!preflight.ok) {
          if (preflight.reason === 'debt' && preflight.pendingSessionId) {
            showInfo(preflight.title, preflight.message, {
              onAfterAccept: () => {
                void navigateToSessionCompletion(preflight.pendingSessionId!);
              },
            });
          } else {
            showInfo(preflight.title, preflight.message);
          }
          return;
        }

        bottomSheetRef.current?.close();

        if (!navigationRef.isReady()) return;
        navigationRef.navigate('CreateReserva', {
          stationId: selectedStation.id,
          stationName: selectedStation.name,
          chargePointConnectorId: connector.id,
          connectorLabel: formatConnectorLabel(connector),
        });
      })();
    },
    [selectedStation, showInfo],
  );

  const mapMarkers = useMemo(
    () =>
      stations
        .map(s => {
          const latitude = parseFloat(s.latitude);
          const longitude = parseFloat(s.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }
          return {
            id: s.id,
            coordinate: { latitude, longitude },
            title: s.name,
            station: s,
          };
        })
        .filter((m): m is NonNullable<typeof m> => m != null),
    [stations],
  );

  if (mapRegion == null) {
    return (
      <View
        style={[styles.container, styles.mapLoading, { backgroundColor: colors.background }]}
        accessibilityLabel="Cargando mapa"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const mapFloatingButtonBg = theme['background-basic-color-1'];

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper} pointerEvents="box-none">
        <MapView
          key={mapUserInterfaceStyle}
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          mapType="standard"
          userInterfaceStyle={mapUserInterfaceStyle}
          customMapStyle={customMapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled
          pitchEnabled={false}
          toolbarEnabled={false}
          onRegionChangeComplete={() => {
            void syncMapHeading();
          }}
        >
          {userLocation ? (
            <Marker
              identifier="user-location"
              coordinate={userLocation}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              accessibilityLabel="Tu ubicación"
            >
              <View style={styles.userLocationDotOuter}>
                <View style={styles.userLocationDotInner} />
              </View>
            </Marker>
          ) : null}
          {mapMarkers.map(m => (
            <Marker
              key={`${m.id}-${markersRevision}`}
              identifier={m.id}
              coordinate={m.coordinate}
              title={m.title}
              onPress={() => handleStationMarkerPress(m.station)}
            />
          ))}
        </MapView>

        {Math.abs(mapHeading) > MAP_NORTH_ALIGNED_THRESHOLD ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restablecer orientación al norte"
            hitSlop={8}
            style={[
              styles.mapFloatingButton,
              {
                right: mapFloatingInsets.right,
                bottom: mapFloatingInsets.compassBottom,
                backgroundColor: mapFloatingButtonBg,
              },
            ]}
            onPress={() => void handleResetNorth()}
          >
            <View style={{ transform: [{ rotate: `${-mapHeading}deg` }] }}>
              <Icon name="compass" size={22} color={colors.primary} iconStyle="solid" />
            </View>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a mi ubicación"
          hitSlop={8}
          style={[
            styles.mapFloatingButton,
            {
              right: mapFloatingInsets.right,
              bottom: mapFloatingInsets.locationBottom,
              backgroundColor: mapFloatingButtonBg,
            },
          ]}
          onPress={handleMyLocationPress}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="location-crosshairs" size={22} color={colors.primary} iconStyle="solid" />
          )}
        </Pressable>
      </View>

      <View style={styles.bottomSheetWrapper} pointerEvents="box-none">
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          topInset={mapTopBarBottom}
          onChange={index => {
            if (index === -1) {
              setSelectedStationId(null);
            }
          }}
          handleStyle={bottomSheetHandle.handleStyle}
          handleIndicatorStyle={bottomSheetHandle.handleIndicatorStyle}
          backgroundStyle={{
            backgroundColor: theme['background-basic-color-1'],
          }}
        >
          {selectedStation ? (
            <StationSheetList
              station={selectedStation}
              colors={colors}
              onNavigate={handleNavigateToStation}
              onReserve={handleReserveConnector}
            />
          ) : (
            <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
              <View style={styles.emptyState}>
                <KittenText category="h6" style={styles.emptyTitle}>
                  Selecciona una estación
                </KittenText>
                <KittenText category="s1" appearance="hint" style={styles.emptySubtitle}>
                  Presiona un marcador en el mapa para ver la información
                </KittenText>
              </View>
            </BottomSheetScrollView>
          )}
        </BottomSheet>
        {MapInfoDialog}
      </View>
    </View>
  );
}

export const StationsMap = React.memo(
  React.forwardRef<StationsMapRef, StationsMapProps>(StationsMapComponent),
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapLoading: { justifyContent: 'center', alignItems: 'center' },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bottomSheetWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  map: { ...StyleSheet.absoluteFillObject },
  userLocationDotOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: USER_LOCATION_DOT_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: USER_LOCATION_DOT_BORDER,
  },
  userLocationDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: USER_LOCATION_DOT_COLOR,
  },
  sheetHandle: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetContent: { padding: 20, flexGrow: 1 },
  stationList: {
    flex: 1,
  },
  chargePointsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  mapFloatingButton: {
    position: 'absolute',
    width: MAP_FLOATING_BTN_SIZE,
    height: MAP_FLOATING_BTN_SIZE,
    borderRadius: MAP_FLOATING_BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 15,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reservationPlaceholder: {
    fontSize: 16,
    marginTop: 8,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  stationTitleBlock: { flex: 1 },
  stationTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'left' },
  stationAddress: { marginTop: 4, fontSize: 13 },
  stationHorario: { marginTop: 2, fontSize: 13 },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  navigateButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  chargePointBlock: {
    marginBottom: 16,
  },
  chargePointLabel: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
  connectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: { alignItems: 'center', marginBottom: 20 },
  emptyTitle: { textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
  emptySubtitle: { textAlign: 'center', marginTop: 8, fontSize: 14 },
});
