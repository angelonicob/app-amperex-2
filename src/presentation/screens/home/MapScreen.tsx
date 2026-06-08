import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { Layout, useTheme } from '@ui-kitten/components';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermissionsStore } from '../../../modules/permissions/store/usePermissionsStore';
import { Station } from '../../../modules/station/types/station';
import { useStationStore } from '../../../modules/station/store/useStationStore';
import { useNotificationsStore } from '../../../modules/notifications/store/useNotificationsStore';
import type { Notification } from '../../../modules/notifications/types';
import { StationsMap, type StationsMapRef } from '../../../shared/components/map/StationsMap';
import { TAB_BAR_OVERLAY_HEIGHT } from '../../../shared/constants/layout';
import Icon from '../../../shared/components/icons/Icon';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { Disclaimer } from '../../../shared/components/permissions/Disclaimer';
import { PermissionBlocked } from '../../../shared/components/permissions/PermissionBlocked';
import { PermissionRequest } from '../../../shared/components/permissions/PermissionRequest';
import type { BottomTabStackParams } from '../../routes/navigationParams';

function formatNotificationDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Ahora';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString();
}

type MapRouteProp = RouteProp<BottomTabStackParams, 'Mapa'>;

export const MapScreen = () => {
  const colors = useAppTheme();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<MapRouteProp>();
  const navigation = useNavigation<NavigationProp<BottomTabStackParams, 'Mapa'>>();
  const mapRef = useRef<StationsMapRef>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    locationStatus,
    refreshLocationPermission,
    requestLocationPermission,
  } = usePermissionsStore();
  const { stations } = useStationStore();

  const notificationItems = useNotificationsStore(s => s.items);
  const notificationLoading = useNotificationsStore(s => s.isLoading);
  const unreadCount = useNotificationsStore(s => s.unreadCount);
  const loadNotifications = useNotificationsStore(s => s.loadNotifications);
  const markAsRead = useNotificationsStore(s => s.markAsRead);
  const removeNotification = useNotificationsStore(s => s.removeNotification);
  const clearAllNotifications = useNotificationsStore(s => s.clearAllNotifications);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  useEffect(() => {
    if (isNotificationsOpen) {
      void loadNotifications();
    }
  }, [isNotificationsOpen, loadNotifications]);

  const filteredStations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(s => s.name.toLowerCase().includes(q));
  }, [stations, searchQuery]);

  const openSearch = useCallback(() => {
    setIsNotificationsOpen(false);
    setIsSearchOpen(true);
    setSearchQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const openNotifications = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    Keyboard.dismiss();
    setIsNotificationsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  const handleSelectStation = useCallback(
    (station: Station) => {
      mapRef.current?.selectStation(station.id);
      closeSearch();
    },
    [closeSearch],
  );

  useFocusEffect(
    useCallback(() => {
      const stationId = route.params?.stationId;
      if (!stationId) return;
      const timer = setTimeout(() => {
        mapRef.current?.selectStation(stationId);
        navigation.setParams({ stationId: undefined });
      }, 150);
      return () => clearTimeout(timer);
    }, [route.params?.stationId, navigation]),
  );

  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => (
      <View
        style={[
          styles.notificationCard,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.notificationCardBody, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            if (!item.readAt) void markAsRead(item.id);
          }}
        >
          <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: colors.textSecondary }]} numberOfLines={4}>
            {item.body}
          </Text>
          <Text style={[styles.notificationMeta, { color: colors.textSecondary }]}>
            {formatNotificationDate(item.createdAt)}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Eliminar notificación"
          hitSlop={8}
          style={styles.notificationCardDismiss}
          onPress={() => void removeNotification(item.id)}
        >
          <Icon name="xmark" size={18} color={colors.textSecondary} iconStyle="solid" />
        </Pressable>
      </View>
    ),
    [colors, markAsRead, removeNotification],
  );

  if (locationStatus === 'not-determined') {
    return (
      <Layout level="1" style={styles.container}>
        <Disclaimer
          title="Ubicación para el mapa"
          message="Necesitamos tu ubicación para mostrar estaciones cercanas."
          buttonText="Continuar"
          onConfirm={() => requestLocationPermission()}
          onClose={() => refreshLocationPermission()}
        />
      </Layout>
    );
  }

  if (locationStatus === 'requestable') {
    return (
      <Layout level="1" style={styles.container}>
        <PermissionRequest
          title="Ubicación necesaria"
          message="La ubicación es necesaria para usar el mapa."
          screenName="Mapa"
          onRequest={requestLocationPermission}
          onClose={() => refreshLocationPermission()}
          buttonText="Permitir ubicación"
        />
      </Layout>
    );
  }

  if (locationStatus === 'blocked' || locationStatus === 'unavailable') {
    return (
      <Layout level="1" style={styles.container}>
        <PermissionBlocked
          title="Permiso bloqueado"
          message="Has bloqueado el permiso de ubicación. Para usar esta función debes habilitarlo en configuración."
          screenName="Mapa"
          onRefresh={() => refreshLocationPermission()}
        />
      </Layout>
    );
  }

  return (
    <Layout level="1" style={styles.container}>
      <StationsMap ref={mapRef} hasLocationPermission={locationStatus === 'granted'} />

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          style={[
            styles.searchBar,
            { backgroundColor: theme['background-basic-color-1'] },
          ]}
          onPress={openSearch}
        >
          <Icon name="magnifying-glass" size={18} color={colors.textSecondary} iconStyle="solid" />
          <Text style={[styles.searchBarPlaceholder, { color: colors.textSecondary }]}>
            Buscar estaciones
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
          style={[
            styles.notifButton,
            { backgroundColor: theme['background-basic-color-1'] },
          ]}
          onPress={openNotifications}
        >
          <Icon name="bell" size={20} color={colors.textSecondary} iconStyle="solid" />
          {unreadCount > 0 && (
            <View style={[styles.notifBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.notifBadgeText, { color: colors.white }]}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {isSearchOpen && (
        <KeyboardAvoidingView
          style={[
            styles.searchOverlay,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 12,
            },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.searchHeader}>
            <View style={[styles.searchInputRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Icon name="magnifying-glass" size={18} color={colors.textSecondary} iconStyle="solid" />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por nombre..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={12}>
                  <Icon name="circle-xmark" size={20} color={colors.textSecondary} iconStyle="solid" />
                </Pressable>
              )}
            </View>
            <Pressable onPress={closeSearch} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>Cerrar</Text>
            </Pressable>
          </View>

          <FlatList
            data={filteredStations}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + TAB_BAR_OVERLAY_HEIGHT + 24 },
            ]}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
                  {searchQuery.trim() ? 'Ninguna estación coincide' : 'Escribe para filtrar'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.stationItem,
                  { backgroundColor: colors.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleSelectStation(item)}
              >
                <Icon name="location-dot" size={18} color={colors.primary} iconStyle="solid" />
                <Text style={[styles.stationItemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.stationItemMeta, { color: colors.textSecondary }]}>
                  {item.availableConnectors} conectores disponibles
                </Text>
              </Pressable>
            )}
          />
        </KeyboardAvoidingView>
      )}

      {isNotificationsOpen && (
        <View
          style={[
            styles.notificationsOverlay,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <View style={styles.notificationsHeader}>
            <Text style={[styles.notificationsTitle, { color: colors.text }]}>Notificaciones</Text>
            <Pressable onPress={closeNotifications} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>Cerrar</Text>
            </Pressable>
          </View>

          {notificationLoading ? (
            <View style={styles.notificationsLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={notificationItems}
              keyExtractor={n => n.id}
              keyboardShouldPersistTaps="handled"
              style={styles.notificationsList}
              contentContainerStyle={styles.notificationsListContent}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
                    No hay notificaciones
                  </Text>
                </View>
              }
              renderItem={renderNotificationItem}
            />
          )}

          <View
            style={[
              styles.notificationsFooter,
              { borderTopColor: colors.border, paddingBottom: insets.bottom + TAB_BAR_OVERLAY_HEIGHT + 16 },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar todas las notificaciones"
              disabled={notificationItems.length === 0}
              style={({ pressed }) => [
                styles.clearAllButton,
                { opacity: notificationItems.length === 0 ? 0.35 : pressed ? 0.7 : 1 },
              ]}
              onPress={() => void clearAllNotifications()}
            >
              <Icon name="trash-can" size={22} color={colors.primary} iconStyle="solid" />
            </Pressable>
          </View>
        </View>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    zIndex: 5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 10,
  },
  notifButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  searchBarPlaceholder: {
    fontSize: 15,
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  notificationsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificationsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  notificationCardBody: {
    flex: 1,
    padding: 14,
    paddingRight: 8,
  },
  notificationCardDismiss: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 13,
    marginTop: 4,
  },
  notificationMeta: {
    fontSize: 11,
    marginTop: 6,
  },
  notificationsFooter: {
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearAllButton: {
    padding: 12,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  searchInputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  stationItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  stationItemMeta: {
    fontSize: 13,
  },
  emptySearch: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 15,
  },
});
