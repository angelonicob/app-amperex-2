import * as Haptics from 'expo-haptics';
import { useCallback, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from '@ui-kitten/components';
import { FontAwesome6 } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/useAppTheme';

const PRESS_TRANSITION_MS = 90;
const enterEasing = Easing.out(Easing.cubic);

interface HeaderIconButtonProps {
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  children: ReactNode;
  androidRippleColor?: string;
}

function HeaderIconButton({
  onPress,
  style,
  accessibilityLabel,
  children,
  androidRippleColor,
}: HeaderIconButtonProps) {
  const pressProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.value * 0.1 }],
    opacity: 1 - pressProgress.value * 0.12,
  }));

  const handlePressIn = useCallback(() => {
    pressProgress.value = withTiming(1, {
      duration: PRESS_TRANSITION_MS,
      easing: enterEasing,
    });
  }, [pressProgress]);

  const handlePressOut = useCallback(() => {
    pressProgress.value = withTiming(0, {
      duration: PRESS_TRANSITION_MS,
      easing: enterEasing,
    });
  }, [pressProgress]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      android_ripple={
        androidRippleColor ? { color: androidRippleColor } : undefined
      }
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export interface HeaderFlowProps {
  title: string;
  subtitle?: string;
  /** Paso 1: cerrar flujo (X). */
  onClose?: () => void;
  /** Pasos 2+: volver al paso anterior (flecha). */
  onBack?: () => void;
}

export const HeaderFlow = ({ title, subtitle, onClose, onBack }: HeaderFlowProps) => {
  const colors = useAppTheme();
  const showClose = onClose != null;
  const showBack = !showClose && onBack != null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {showClose ? (
          <View style={styles.leadingColumn}>
            <HeaderIconButton
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.backgroundTertiary },
              ]}
              accessibilityLabel="Cancelar"
            >
              <FontAwesome6 name="xmark" size={18} color={colors.text} />
            </HeaderIconButton>
          </View>
        ) : null}
        {showBack ? (
          <View style={styles.leadingColumn}>
            <HeaderIconButton
              onPress={onBack}
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              androidRippleColor="rgba(255,255,255,0.3)"
              accessibilityLabel="Volver"
            >
              <FontAwesome6 name="chevron-left" size={15} color={colors.white} />
            </HeaderIconButton>
          </View>
        ) : null}
        <View style={styles.textColumn}>
          <Text category="h5" style={[styles.title, { color: colors.primary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              category="c1"
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leadingColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 16,
  },
});
