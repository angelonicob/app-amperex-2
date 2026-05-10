import LinearGradient from 'react-native-linear-gradient';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { formFieldStyles } from '../form/formFieldStyles';

const GRADIENT_START = '#CBD639';
const GRADIENT_END = '#32A888';

interface ButtonWithGradientProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const ButtonWithGradient = ({
  onPress,
  title,
  disabled = false,
  style,
  textStyle,
}: ButtonWithGradientProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        formFieldStyles.wrapper,
        styles.pressableClip,
        style,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[GRADIENT_START, GRADIENT_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text style={[styles.label, textStyle]}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  /** Mismo `borderRadius` que el contenedor del `FormInput` para recortar el gradiente. */
  pressableClip: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  /** Misma altura y padding interno que `formFieldStyles.container` (sin borde). */
  gradient: {
    minHeight: 52,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.88,
  },
});
