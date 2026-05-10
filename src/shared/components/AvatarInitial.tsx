import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getColorFromName } from '../utils/avatarColor';

export interface AvatarInitialProps {
  /** Nombre del usuario (username o email); se usa para color y para la inicial. */
  name?: string | null;
  /** Tamaño del círculo en px. Por defecto 48. */
  size?: number;
  /** Estilo adicional del contenedor. */
  style?: ViewStyle;
}

/**
 * Círculo con color determinista según el nombre y la inicial en mayúscula.
 */
export function AvatarInitial({
  name,
  size = 48,
  style,
}: AvatarInitialProps) {
  const displayName = (name && name.trim()) || '?';
  const initial = displayName[0].toUpperCase();
  const backgroundColor = getColorFromName(displayName);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.initial,
          { fontSize: size * 0.45 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
