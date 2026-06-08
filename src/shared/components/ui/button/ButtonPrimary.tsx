import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../../theme/useAppTheme';
import { buttonLabelStyles } from './buttonLabelStyles';

const COLOR_TRANSITION_MS = 260;
const PRESS_TRANSITION_MS = 90;
const enterEasing = Easing.out(Easing.cubic);

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
  const activeProgress = useSharedValue(disabled ? 0 : 1);
  const pressProgress = useSharedValue(0);

  const disabledBackground = theme.textDisabled;
  const activeBackground = theme.primary;
  const pressedBackground = theme.primaryDark;

  useEffect(() => {
    activeProgress.value = withTiming(disabled ? 0 : 1, {
      duration: COLOR_TRANSITION_MS,
      easing: enterEasing,
    });
    if (disabled) {
      pressProgress.value = 0;
    }
  }, [activeBackground, activeProgress, disabled, disabledBackground, pressProgress]);

  const shadowStyle = useMemo(() => {
    if (theme.isDark) {
      return {
        shadowColor: theme.black,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      } as const;
    }
    return {
      shadowColor: theme.black,
      shadowRadius: 6,
    } as const;
  }, [theme.black, theme.isDark]);

  const animatedSurfaceStyle = useAnimatedStyle(() => {
    const shadowOpacity =
      theme.isDark
        ? activeProgress.value * 0.55
        : activeProgress.value * 0.34;

    const baseBackground = interpolateColor(
      activeProgress.value,
      [0, 1],
      [disabledBackground, activeBackground],
    );

    return {
      backgroundColor: interpolateColor(
        pressProgress.value,
        [0, 1],
        [baseBackground, pressedBackground],
      ),
      shadowOpacity,
      elevation: activeProgress.value * 6,
    };
  }, [
    activeBackground,
    disabledBackground,
    pressedBackground,
    theme.isDark,
  ]);

  const handlePressIn = useCallback(() => {
    if (disabled) {
      return;
    }
    pressProgress.value = withTiming(1, {
      duration: PRESS_TRANSITION_MS,
      easing: enterEasing,
    });
  }, [disabled, pressProgress]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withTiming(0, {
      duration: PRESS_TRANSITION_MS,
      easing: enterEasing,
    });
  }, [pressProgress]);

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [disabled, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.wrapper}
    >
      <Animated.View
        style={[styles.base, shadowStyle, animatedSurfaceStyle, style]}
      >
        <Text style={[buttonLabelStyles.label, styles.label]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
  },
  base: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    color: '#FFFFFF',
  },
});
