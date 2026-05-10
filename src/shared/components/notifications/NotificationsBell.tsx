import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { useNotificationsStore } from '../../../modules/notifications/store/useNotificationsStore';
import type { Notification } from '../../../modules/notifications/types';

export function NotificationsBell() {
  const colors = useAppTheme();
  const [open, setOpen] = useState(false);
  const {
    items,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    removeNotification,
  } = useNotificationsStore();

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} h`;
    return d.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => {
        if (!item.readAt) markAsRead(item.id);
      }}
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: item.readAt ? 'transparent' : colors.background,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontWeight: '600', color: colors.text, flex: 1 }}>
          {item.title}
        </Text>
        <TouchableOpacity
          onPress={() => removeNotification(item.id)}
          hitSlop={8}
          style={{ padding: 4 }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
        {item.body}
      </Text>
      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
        {formatDate(item.createdAt)}
      </Text>
    </Pressable>
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ padding: 8 }}
        hitSlop={8}
      >
        <View>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.white, fontSize: 10, fontWeight: '700' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              width: '90%',
              maxHeight: '70%',
              backgroundColor: colors.background,
              borderRadius: 12,
              overflow: 'hidden',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                Notificaciones
              </Text>
            </View>
            {isLoading ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : items.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: colors.textSecondary }}>No hay notificaciones</Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(n) => n.id}
                renderItem={renderItem}
                style={{ maxHeight: 400 }}
              />
            )}
            <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={{ padding: 8, alignItems: 'center' }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
