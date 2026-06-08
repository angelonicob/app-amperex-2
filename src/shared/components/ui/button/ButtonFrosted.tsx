import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { buttonLabelStyles } from './buttonLabelStyles';

const FROSTED_BG = 'rgba(255, 255, 255, 0.18)';
const FROSTED_BG_PRESSED = 'rgba(255, 255, 255, 0.28)';
const FROSTED_BG_DISABLED = 'rgba(255, 255, 255, 0.1)';

interface ButtonFrostedProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ButtonFrosted = ({
  title,
  onPress,
  style,
  disabled = false,
}: ButtonFrostedProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.base,
      {
        backgroundColor: disabled
          ? FROSTED_BG_DISABLED
          : pressed
            ? FROSTED_BG_PRESSED
            : FROSTED_BG,
      },
      style,
    ]}
  >
    <Text style={[buttonLabelStyles.label, styles.label, disabled && buttonLabelStyles.labelDisabled]}>
      {title}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
  },
});
