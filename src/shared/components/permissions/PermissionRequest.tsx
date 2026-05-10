import type { PropsWithChildren } from 'react';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
    <View style={[styles.container, { backgroundColor: colors.background ?? '#F9FAFB' }]}>
      <View style={styles.card}>
        {screenName != null && screenName !== '' && (
          <Text style={styles.screenName}>{screenName}</Text>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

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
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Cerrar</Text>
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
