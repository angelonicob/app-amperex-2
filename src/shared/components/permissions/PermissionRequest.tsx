import type { PropsWithChildren } from 'react';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';

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
}

export function PermissionRequest({
  title = 'Permiso requerido',
  message,
  screenName,
  onRequest,
  onClose,
  buttonText = 'Permitir',
}: PropsWithChildren<PermissionRequestProps>) {
  const colors = useAppTheme();

  const handleRequest = () => {
    const result = onRequest();
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
            <Text category="s1" appearance="hint">
              Cerrar
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
