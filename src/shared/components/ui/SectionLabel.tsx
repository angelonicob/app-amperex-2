import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';

export interface SectionLabelProps {
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /**
   * Si se define, aplica margen horizontal negativo para banda a ancho completo
   * respecto al padding del contenedor padre (p. ej. 16 en listas).
   */
  bleedHorizontal?: number;
}

/**
 * Banda de sección con fondo terciario del tema (más claro en oscuro, gris en claro).
 */
export function SectionLabel({
  label,
  style,
  textStyle,
  bleedHorizontal = 16,
}: SectionLabelProps) {
  const colors = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        bleedHorizontal > 0 && { marginHorizontal: -bleedHorizontal },
        { backgroundColor: colors.backgroundTertiary },
        style,
      ]}
    >
      <Text
        category="s2"
        style={[styles.label, { color: colors.textSecondary }, textStyle]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: '600',
  },
});
