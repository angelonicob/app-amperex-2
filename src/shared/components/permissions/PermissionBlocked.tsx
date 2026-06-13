import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet, Linking, View } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import { getPermissionFullScreenColors } from './permissionFullScreenTheme';

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
  /** Pantalla completa con fondo oscuro (p. ej. cámara sin permiso). */
  fullScreen?: boolean;
}

export function PermissionBlocked({
  title = 'Permiso bloqueado',
  message,
  screenName,
  onRefresh,
  buttonText = 'Abrir configuración',
  fullScreen = false,
}: PropsWithChildren<PermissionBlockedProps>) {
  const colors = useAppTheme();
  const fullScreenColors = getPermissionFullScreenColors(colors);

  const handleRefresh = () => {
    if (onRefresh == null) return;
    const result = onRefresh();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  };

  const content = (
    <>
      {screenName != null && screenName !== '' && (
        <Text
          category="c1"
          appearance="hint"
          style={[styles.screenName, fullScreen && { color: fullScreenColors.hint }]}
        >
          {screenName}
        </Text>
      )}
      <Text
        category="h6"
        style={[styles.title, fullScreen && { color: fullScreenColors.title }]}
      >
        {title}
      </Text>
      <Text
        category="s1"
        appearance="hint"
        style={[styles.message, fullScreen && { color: fullScreenColors.hint }]}
      >
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
    </>
  );

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenContainer,
          { backgroundColor: fullScreenColors.background },
        ]}
      >
        <View style={styles.fullScreenContent}>{content}</View>
      </View>
    );
  }

  return (
    <Layout level="1" style={styles.container}>
      <Layout level="2" style={styles.card}>
        {content}
      </Layout>
    </Layout>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullScreenContent: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
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
