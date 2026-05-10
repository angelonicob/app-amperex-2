import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
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
import { useAppTheme } from '../../theme/useAppTheme';
import { GOOGLE_MAP_DARK_STYLE } from './googleMapStyles';
import { zoomToRegion } from './mapZoom';
import { TAB_BAR_OVERLAY_HEIGHT } from '../../constants/layout';

const DEFAULT_ZOOM = 14;

const DEFAULT_MAP_CENTER = { latitude: 19.4326, longitude: -99.1332 };

function useMyLocationButtonInsets() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const minSide = Math.min(windowWidth, windowHeight);

  return useMemo(() => {
    const horizontal = Math.max(12, Math.min(24, Math.round(minSide * 0.042)));
    const bottomGap = Math.max(10, Math.min(20, Math.round(minSide * 0.034)));
    const bottom = bottomGap + insets.bottom + TAB_BAR_OVERLAY_HEIGHT;
    const right = horizontal + insets.right;
    return { right, bottom };
  }, [insets.bottom, insets.right, minSide]);
}

export interface StationsMapProps {
  hasLocationPermission: boolean;
}

export interface StationsMapRef {
  selectStation: (stationId: string) => void;
}

function StationsMapComponent(
  { hasLocationPermission }: StationsMapProps,
  ref: React.Ref<StationsMapRef>,
) {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const myLocationInsets = useMyLocationButtonInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fallbackRegion = () =>
      zoomToRegion(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude, DEFAULT_ZOOM);

    const load = async () => {
      if (!hasLocationPermission) {
        if (!cancelled) setMapRegion(fallbackRegion());
        return;
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

    load();
    return () => {
      cancelled = true;
    };
  }, [hasLocationPermission]);

  const customMapStyle = useMemo(
    () => (colors.isDark ? GOOGLE_MAP_DARK_STYLE : undefined),
    [colors.isDark],
  );

  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [selectedForReservation, setSelectedForReservation] = useState<{
    connector: Connector;
    chargePoint: ChargePoint;
  } | null>(null);
  const [stationsLoaded, setStationsLoaded] = useState(false);

  const { stations, fetchStations, updateConnectorStatus } = useStationStore();

  const selectedStation = useMemo(() => {
    if (!selectedStationId) return null;
    return stations.find(s => s.id === selectedStationId) ?? null;
  }, [stations, selectedStationId]);

  useEffect(() => {
    const loadStations = async () => {
      try {
        await fetchStations();
        setStationsLoaded(true);
      } catch (error) {
        console.error('Error al cargar estaciones:', error);
      }
    };
    loadStations();
  }, [fetchStations]);

  const { lastUpdate } = useStationsWebSocket(stationsLoaded);

  useEffect(() => {
    if (lastUpdate?.type === 'connector-status-updated') {
      updateConnectorStatus({
        stationId: lastUpdate.data.stationId,
        connectorId: lastUpdate.data.connectorId,
        connectorNumber: lastUpdate.data.connectorNumber,
        status: lastUpdate.data.status,
      });
    }
  }, [lastUpdate, updateConnectorStatus]);

  const snapPoints = useMemo(() => ['25%', '50%', '75%'], []);

  const animateToStationCoords = useCallback((latitude: number, longitude: number) => {
    mapRef.current?.animateToRegion(
      zoomToRegion(latitude, longitude, DEFAULT_ZOOM),
      350,
    );
  }, []);

  const handleStationMarkerPress = useCallback(
    (station: Station) => {
      setSelectedStationId(station.id);
      setSelectedForReservation(null);
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
        setSelectedForReservation(null);
        animateToStationCoords(parseFloat(station.latitude), parseFloat(station.longitude));
        bottomSheetRef.current?.expand();
      }
    },
    [stations, animateToStationCoords],
  );

  useImperativeHandle(ref, () => ({ selectStation }), [selectStation]);

  const handleCenterOnMyLocation = useCallback(async () => {
    if (!hasLocationPermission) return;
    try {
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      animateToStationCoords(coords.latitude, coords.longitude);
    } catch {
      /* sin ubicación */
    }
  }, [hasLocationPermission, animateToStationCoords]);

  const handleNavigateToStation = useCallback((station: Station) => {
    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  }, []);

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

  return (
    <View style={styles.container}>
      <View style={[styles.bottomSheetWrapper, { zIndex: selectedStationId ? 1 : 0 }]}>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          topInset={insets.top + 60}
          onChange={index => {
            if (index === -1) {
              setSelectedStationId(null);
              setSelectedForReservation(null);
            }
          }}
          handleIndicatorStyle={{
            backgroundColor: '#D1D5DB',
            width: 40,
            height: 4,
          }}
          backgroundStyle={{ backgroundColor: '#FFFFFF' }}
        >
          <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
            {selectedForReservation ? (
              <View>
                <Pressable
                  onPress={() => setSelectedForReservation(null)}
                  style={styles.backButton}
                >
                  <Icon name="arrow-left" size={20} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16 }}>Volver</Text>
                </Pressable>
                <Text style={[styles.reservationPlaceholder, { color: colors.text }]}>
                  Reservar conector — Próximamente
                </Text>
              </View>
            ) : selectedStation ? (
              <>
                <View style={styles.stationHeader}>
                  <View style={styles.stationTitleBlock}>
                    <Text style={[styles.stationTitle, { color: colors.primary }]}>
                      {selectedStation.name}
                    </Text>
                    {selectedStation.openAt != null && selectedStation.closeAt != null ? (
                      <Text style={styles.stationHorario}>
                        Horario: {selectedStation.openAt} - {selectedStation.closeAt}
                      </Text>
                    ) : null}
                    <Text style={styles.stationSubtitle}>
                      {selectedStation.availableConnectors} de{' '}
                      {selectedStation.totalConnectors} conectores disponibles
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleNavigateToStation(selectedStation)}
                    style={({ pressed }) => [
                      styles.navigateButton,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Icon name="location-arrow" size={14} color={colors.white} />
                    <Text style={styles.navigateButtonText}>Navegar</Text>
                  </Pressable>
                </View>
                <View style={{ marginTop: 15 }}>
                  {selectedStation.chargePoints.map(chargePoint => (
                    <View key={chargePoint.id} style={styles.chargePointBlock}>
                      <Text style={styles.chargePointLabel}>
                        {chargePoint.name}
                      </Text>
                      <View style={styles.connectorGrid}>
                        {chargePoint.connectors.map(connector => (
                          <CardConnector
                            key={connector.id}
                            connector={connector}
                            chargePoint={chargePoint}
                            onReserve={() =>
                              setSelectedForReservation({ connector, chargePoint })
                            }
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Selecciona una estación</Text>
                <Text style={styles.emptySubtitle}>
                  Presiona un marcador en el mapa para ver la información
                </Text>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>

      <View style={[styles.mapWrapper, { zIndex: selectedStationId ? 0 : 1 }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          mapType="standard"
          customMapStyle={customMapStyle}
          showsUserLocation={hasLocationPermission}
          showsMyLocationButton={false}
          rotateEnabled
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {mapMarkers.map(m => (
            <Marker
              key={m.id}
              identifier={m.id}
              coordinate={m.coordinate}
              title={m.title}
              onPress={() => handleStationMarkerPress(m.station)}
            />
          ))}
        </MapView>

        {hasLocationPermission && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir a mi ubicación"
            hitSlop={8}
            style={[
              styles.myLocationButton,
              {
                right: myLocationInsets.right,
                bottom: myLocationInsets.bottom,
              },
            ]}
            onPress={handleCenterOnMyLocation}
          >
            <Icon name="location-crosshairs" size={22} color={colors.primary} iconStyle="solid" />
          </Pressable>
        )}
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
  mapWrapper: { ...StyleSheet.absoluteFillObject },
  bottomSheetWrapper: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
  sheetContent: { padding: 20, flexGrow: 1 },
  myLocationButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    marginBottom: 20,
    gap: 12,
  },
  stationTitleBlock: { flex: 1 },
  stationTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'left' },
  stationHorario: { marginTop: 4, fontSize: 13, color: '#6B7280' },
  stationSubtitle: { marginTop: 2, fontSize: 13, color: '#6B7280' },
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
