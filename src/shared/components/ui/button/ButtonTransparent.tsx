import { Button, Text } from '@ui-kitten/components';
import type { TextProps } from '@ui-kitten/components/ui/text/text.component';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

interface ButtonTransparentProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Canal alpha del blanco `rgba(255,255,255, α)` (0–1). Por defecto 30%.
   */
  opacity?: number;
}

export const ButtonTransparent = ({
  title,
  onPress,
  style,
  disabled = false,
  opacity = 0.3,
}: ButtonTransparentProps) => {
  return (
    <Button
      appearance="filled"
      status="basic"
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.defaults,
        style,
        {
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          borderWidth: 0,
          borderColor: 'transparent',
        },
      ]}
    >
      {(evaProps: TextProps) => (
        <Text
          {...evaProps}
          style={[evaProps.style, { color: '#FFFFFF' }]}
        >
          {title}
        </Text>
      )}
    </Button>
  );
};

const styles = StyleSheet.create({
  defaults: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
});
