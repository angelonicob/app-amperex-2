import { Button } from '@ui-kitten/components';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { PopupShell } from './PopupShell';

export type ConfirmPopupProps = {
  visible: boolean;
  onRequestClose: () => void;
  onDismissed?: () => void;
  title?: string;
  children?: ReactNode;
  labelConfirm: string;
  labelCancel?: string;
  onConfirm: () => void;
  confirmDestructive?: boolean;
  loading?: boolean;
};

/**
 * Modal de confirmación
 * No se cierra tocando fuera ni con botón atrás; el cierre lo controla la acción cancelar.
 */
export const ConfirmPopup = ({
  visible,
  onRequestClose,
  onDismissed,
  title,
  children,
  labelConfirm,
  labelCancel = 'Cancelar',
  onConfirm,
  confirmDestructive = false,
  loading = false,
}: ConfirmPopupProps) => (
  <PopupShell
    visible={visible}
    onRequestClose={() => {}}
    onDismissed={onDismissed}
    title={title}
    footer={
      <View style={styles.actions}>
        <Button
          appearance="filled"
          status={confirmDestructive ? 'danger' : 'primary'}
          style={styles.actionBtn}
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? '…' : labelConfirm}
        </Button>
        <Button
          appearance="ghost"
          status="danger"
          style={[styles.actionBtn, styles.actionBtnLeft]}
          onPress={onRequestClose}
          disabled={loading}
        >
          {labelCancel}
        </Button>
      </View>
    }
  >
    {children}
  </PopupShell>
);

const styles = StyleSheet.create({
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
