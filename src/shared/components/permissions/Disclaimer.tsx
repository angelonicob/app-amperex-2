import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import { getPermissionFullScreenColors } from './permissionFullScreenTheme';

/**
 * 1️⃣ Pantalla de pre-permission (primera vez / not-determined).
 * Muestra un disclaimer explicativo y un botón para continuar → pedir permiso.
 */
export interface DisclaimerProps {
  title?: string;
  message: string;
  buttonText?: string;
  /** Al tocar el botón principal (ej. "Continuar") → típicamente requestPermission(). */
  onConfirm: () => void | Promise<unknown>;
  /** Opcional: al tocar cerrar (✕). Si no se pasa, no se muestra el botón cerrar. */
  onClose?: () => void;
  /** Pantalla completa con fondo oscuro (p. ej. cámara sin permiso). */
  fullScreen?: boolean;
}

export function Disclaimer({
  title = 'Permiso necesario',
  message,
  buttonText = 'Continuar',
  onConfirm,
  onClose,
  fullScreen = false,
}: PropsWithChildren<DisclaimerProps>) {
  const colors = useAppTheme();
  const fullScreenColors = getPermissionFullScreenColors(colors);

  const handleConfirm = () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  };

  const content = (
    <>
      {onClose != null && (
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text
            style={[
              styles.closeText,
              fullScreen && { color: fullScreenColors.hint },
            ]}
          >
            ✕
          </Text>
        </Pressable>
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
        onPress={handleConfirm}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </Pressable>
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
    position: 'relative',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 2,
  },
  closeText: { fontSize: 18, fontWeight: '700' },
  title: { marginBottom: 12, textAlign: 'center' },
  message: { textAlign: 'center', marginBottom: 20 },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
