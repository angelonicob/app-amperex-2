import type { PropsWithChildren } from 'react';
import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

/**
 * 3️⃣ Pantalla cuando el permiso está blocked (usuario bloqueó en sistema).
 * Mensaje claro + botón "Abrir configuración" (Linking.openSettings) + opcional "Ya habilité el permiso" (onRefresh).
 */
export interface PermissionBlockedProps {
  title?: string;
  message: string;
  screenName?: string;
  /** Al tocar "Ya habilité el permiso" → refreshPermission() para reconsultar estado. */
  onRefresh?: () => void | Promise<unknown>;
  buttonText?: string;
}

export function PermissionBlocked({
  title = 'Permiso bloqueado',
  message,
  screenName,
  onRefresh,
  buttonText = 'Abrir configuración',
}: PropsWithChildren<PermissionBlockedProps>) {
  const colors = useAppTheme();

  const handleRefresh = () => {
    if (onRefresh == null) return;
    const result = onRefresh();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background ?? '#F9FAFB' }]}>
      <View style={styles.card}>
        {screenName != null && screenName !== '' && (
          <Text style={styles.screenName}>{screenName}</Text>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <Pressable
          onPress={() => Linking.openSettings()}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>

        {onRefresh != null && (
          <Pressable onPress={handleRefresh} style={styles.secondaryButton}>
            <Text style={[styles.secondaryText, { color: colors.primary }]}>Ya habilité el permiso</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  screenName: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 18 },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { marginTop: 12 },
  secondaryText: { fontWeight: '600' },
});
