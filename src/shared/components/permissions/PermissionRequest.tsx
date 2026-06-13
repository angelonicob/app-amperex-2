import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import { getPermissionFullScreenColors } from './permissionFullScreenTheme';

/**
 * 2️⃣ Pantalla cuando el permiso está requestable (usuario negó una vez, aún se puede pedir).
 * Mensaje suave + botón para volver a llamar requestPermission().
 */
export interface PermissionRequestProps {
  title?: string;
  message: string;
  screenName?: string;
  /** Al tocar el botón principal → requestPermission(). */
  onRequest: () => void | Promise<unknown>;
  /** Opcional: botón secundario (ej. "Cerrar" o refrescar). */
  onClose?: () => void;
  buttonText?: string;
  /** Pantalla completa con fondo oscuro (p. ej. cámara sin permiso). */
  fullScreen?: boolean;
}

export function PermissionRequest({
  title = 'Permiso requerido',
  message,
  screenName,
  onRequest,
  onClose,
  buttonText = 'Permitir',
  fullScreen = false,
}: PropsWithChildren<PermissionRequestProps>) {
  const colors = useAppTheme();
  const fullScreenColors = getPermissionFullScreenColors(colors);

  const handleRequest = () => {
    const result = onRequest();
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
        onPress={handleRequest}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </Pressable>

      {onClose != null && (
        <Pressable onPress={onClose} style={styles.secondaryButton}>
          <Text
            category="s1"
            appearance="hint"
            style={fullScreen ? { color: fullScreenColors.hint } : undefined}
          >
            Cerrar
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
