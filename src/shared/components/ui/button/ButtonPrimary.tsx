import { Button, Text } from '@ui-kitten/components';
import type { TextProps } from '@ui-kitten/components/ui/text/text.component';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../../theme/useAppTheme';

/** Verde fijo de marca; no depende del tema claro/oscuro. */
const PRIMARY_BG = '#44B778';

interface ButtonPrimaryProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ButtonPrimary = ({
  title,
  onPress,
  disabled = false,
  style,
}: ButtonPrimaryProps) => {
  const theme = useAppTheme();

  const handlePress = useCallback(() => {
    if (!disabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [disabled, onPress]);

  const shadowStyle = useMemo(() => {
    if (theme.isDark) {
      return {
        shadowColor: theme.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.55,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      } as const;
    }
    return {
      shadowColor: theme.black,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.34,
      shadowRadius: 10,
      elevation: 8,
    } as const;
  }, [theme.black, theme.isDark]);

  return (
    <Button
      appearance="filled"
      status="basic"
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.88}
      style={[
        styles.base,
        shadowStyle,
        style,
        { backgroundColor: PRIMARY_BG },
      ]}
    >
      {(evaProps: TextProps) => (
        <Text
          {...evaProps}
          style={[evaProps.style, styles.label]}
        >
          {title}
        </Text>
      )}
    </Button>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'visible',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
