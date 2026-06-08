import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { lightColors } from '../../../theme/config/colors';

const PRIMARY = lightColors.primary;

interface ButtonTransparentProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Color del texto. Por defecto: primary de la app. */
  color?: string;
}

export const ButtonTransparent = ({
  title,
  onPress,
  style,
  disabled = false,
  color = PRIMARY,
}: ButtonTransparentProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.base,
      style,
      disabled && styles.disabled,
      pressed && !disabled && styles.pressed,
    ]}
  >
    <Text style={[styles.label, { color }]}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
});
