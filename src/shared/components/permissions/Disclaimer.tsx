import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';

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
}

export function Disclaimer({
  title = 'Permiso necesario',
  message,
  buttonText = 'Continuar',
  onConfirm,
  onClose,
}: PropsWithChildren<DisclaimerProps>) {
  const colors = useAppTheme();

  const handleConfirm = () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  };

  return (
    <Layout level="1" style={styles.container}>
      <Layout level="2" style={styles.card}>
        {onClose != null && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
        <Text category="h6" style={styles.title}>
          {title}
        </Text>
        <Text category="s1" appearance="hint" style={styles.message}>
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
      </Layout>
    </Layout>
  );
}

const styles = StyleSheet.create({
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
