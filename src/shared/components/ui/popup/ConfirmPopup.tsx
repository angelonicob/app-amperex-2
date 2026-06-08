import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../../theme/useAppTheme';
import { ButtonPrimary, ButtonTransparent } from '../button';
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
}: ConfirmPopupProps) => {
  const colors = useAppTheme();
  const confirmTitle = loading ? '…' : labelConfirm;

  return (
    <PopupShell
      visible={visible}
      onRequestClose={() => {}}
      onDismissed={onDismissed}
      title={title}
      footer={
        <View style={styles.actions}>
          {confirmDestructive ? (
            <ButtonTransparent
              title={confirmTitle}
              onPress={onConfirm}
              disabled={loading}
              color="#FFFFFF"
              style={[styles.actionBtn, { backgroundColor: colors.danger }]}
            />
          ) : (
            <ButtonPrimary
              title={confirmTitle}
              onPress={onConfirm}
              disabled={loading}
              style={styles.actionBtn}
            />
          )}
          <ButtonTransparent
            title={labelCancel}
            onPress={onRequestClose}
            disabled={loading}
            color={colors.danger}
            style={styles.actionBtn}
          />
        </View>
      }
    >
      {children}
    </PopupShell>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
});
