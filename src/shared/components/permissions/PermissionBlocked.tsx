import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet, Linking } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
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
    <Layout level="1" style={styles.container}>
      <Layout level="2" style={styles.card}>
        {screenName != null && screenName !== '' && (
          <Text category="c1" appearance="hint" style={styles.screenName}>
            {screenName}
          </Text>
        )}
        <Text category="h6" style={styles.title}>
          {title}
        </Text>
        <Text category="s1" appearance="hint" style={styles.message}>
          {message}
        </Text>

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
            <Text category="s1" style={{ color: colors.primary }}>
              Ya habilité el permiso
            </Text>
          </Pressable>
        )}
      </Layout>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  screenName: { marginBottom: 6, textAlign: 'center' },
  title: { marginBottom: 8, textAlign: 'center' },
  message: { textAlign: 'center', marginBottom: 18 },
  button: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryButton: { marginTop: 12 },
});
