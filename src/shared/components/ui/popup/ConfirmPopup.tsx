import { Button, Text } from '@ui-kitten/components';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/useAppTheme';
import { popupTemplateStyles, withPopupInsets } from './popupStyles';

export type ConfirmPopupProps = {
  visible: boolean;
  onRequestClose: () => void;
  /** Título opcional encima del contenido. */
  title?: string;
  /** Contenido principal (texto, vistas, etc.). */
  children?: ReactNode;
  labelConfirm: string;
  labelCancel?: string;
  onConfirm: () => void;
  /** Si es true, el botón de confirmación usa `status=\"danger\"` (p. ej. eliminar). */
  confirmDestructive?: boolean;
  loading?: boolean;
};

/**
 * Modal de confirmación con contenido configurable por `children` y props.
 * No se cierra tocando fuera ni con botón atrás; el cierre lo controla la acción cancelar.
 */
export const ConfirmPopup = ({
  visible,
  onRequestClose,
  title,
  children,
  labelConfirm,
  labelCancel = 'Cancelar',
  onConfirm,
  confirmDestructive = false,
  loading = false,
}: ConfirmPopupProps) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View
        style={[popupTemplateStyles.backdrop, withPopupInsets(insets)]}
      >
        <Pressable onPress={() => {}} style={popupTemplateStyles.cardHitSlop}>
          <View
            style={[
              popupTemplateStyles.sheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            {title ? (
              <Text category="h5" style={[popupTemplateStyles.title, { color: theme.text }]}>
                {title}
              </Text>
            ) : null}
            {children != null ? (
              <View style={styles.body}>{children}</View>
            ) : null}
            <View style={styles.actions}>
              <Button
                appearance="ghost"
                status="danger"
                style={[styles.actionBtn, styles.actionBtnLeft]}
                onPress={onRequestClose}
                disabled={loading}
              >
                {labelCancel}
              </Button>
              <Button
                appearance="filled"
                status={confirmDestructive ? 'danger' : 'primary'}
                style={styles.actionBtn}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? '…' : labelConfirm}
              </Button>
            </View>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnLeft: {
    marginRight: 12,
  },
});
