import { Layout, Text } from '@ui-kitten/components';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_HORIZONTAL_PADDING } from '../../../theme/theme';
import { useAppTheme } from '../../../theme/useAppTheme';
import { popupTemplateStyles } from './popupStyles';

/** Margen lateral e inferior (sobre el área segura del dispositivo). */
const POPUP_EDGE_MARGIN = CONTENT_HORIZONTAL_PADDING;
const ANIM_DURATION_MS = 280;
const SLIDE_DISTANCE = 420;

const enterEasing = Easing.out(Easing.cubic);
const exitEasing = Easing.in(Easing.cubic);

export type PopupShellProps = {
  visible: boolean;
  /** Android back; por defecto no hace nada (el popup controla su cierre). */
  onRequestClose?: () => void;
  /** Se invoca tras completar la animación de cierre y desmontar el modal. */
  onDismissed?: () => void;
  title?: string;
  children?: ReactNode;
  /** Pie del sheet: botones, acciones, etc. */
  footer?: ReactNode;
};

/**
 * Plantilla base para popups: modal con backdrop, animación slide-up y sheet.
 * El contenido específico va en `children`; acciones en `footer`.
 */
export const PopupShell = ({
  visible,
  onRequestClose,
  onDismissed,
  title,
  children,
  footer,
}: PopupShellProps) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const [mounted, setMounted] = useState(visible);
  const wasVisibleRef = useRef(visible);
  const onDismissedRef = useRef(onDismissed);
  const translateY = useSharedValue(SLIDE_DISTANCE);
  const backdropOpacity = useSharedValue(0);

  onDismissedRef.current = onDismissed;

  const finishDismiss = () => {
    setMounted(false);
    onDismissedRef.current?.();
  };

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      setMounted(true);
      cancelAnimation(translateY);
      cancelAnimation(backdropOpacity);
      translateY.value = SLIDE_DISTANCE;
      backdropOpacity.value = 0;
      translateY.value = withTiming(0, {
        duration: ANIM_DURATION_MS,
        easing: enterEasing,
      });
      backdropOpacity.value = withTiming(1, {
        duration: ANIM_DURATION_MS,
        easing: enterEasing,
      });
      return;
    }

    if (!wasVisibleRef.current) {
      return;
    }

    wasVisibleRef.current = false;
    cancelAnimation(translateY);
    cancelAnimation(backdropOpacity);
    translateY.value = withTiming(
      SLIDE_DISTANCE,
      {
        duration: ANIM_DURATION_MS,
        easing: exitEasing,
      },
      (finished) => {
        if (finished) {
          runOnJS(finishDismiss)();
        }
      },
    );
    backdropOpacity.value = withTiming(0, {
      duration: ANIM_DURATION_MS,
      easing: exitEasing,
    });
  }, [visible, translateY, backdropOpacity]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onRequestClose ?? (() => {})}
    >
      <Animated.View
        style={[
          popupTemplateStyles.backdrop,
          styles.backdropBottom,
          backdropAnimatedStyle,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + POPUP_EDGE_MARGIN,
            paddingHorizontal: POPUP_EDGE_MARGIN,
          },
        ]}
      >
        <Animated.View style={[popupTemplateStyles.cardHitSlop, sheetAnimatedStyle]}>
          <Pressable onPress={() => {}}>
            <Layout
              level="2"
              style={[popupTemplateStyles.sheet, { borderColor: theme.border }]}
            >
              {title ? (
                <Text category="h5" style={popupTemplateStyles.title}>
                  {title}
                </Text>
              ) : null}
              {children != null ? <View style={styles.body}>{children}</View> : null}
              {footer != null ? <View style={styles.footer}>{footer}</View> : null}
            </Layout>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdropBottom: {
    justifyContent: 'flex-end',
  },
  body: {
    marginBottom: 16,
  },
  footer: {},
});
