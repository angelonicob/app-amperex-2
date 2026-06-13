import { Text } from '@ui-kitten/components';
import { Linking, StyleSheet } from 'react-native';
import type { PermissionState } from '../../../modules/permissions/types';
import { useAppTheme } from '../../theme/useAppTheme';
import { ConfirmPopup } from '../ui/popup/ConfirmPopup';

export type PermissionConfirmPopupProps = {
  visible: boolean;
  status: PermissionState;
  title: string;
  message: string;
  disclaimerTitle?: string;
  requestButtonText?: string;
  onRequest: () => void | Promise<unknown>;
  onRefresh: () => void | Promise<unknown>;
  onClose: () => void;
};

function runAsync(fn: () => void | Promise<unknown>) {
  const result = fn();
  if (result instanceof Promise) {
    result.catch(() => {});
  }
}

export function PermissionConfirmPopup({
  visible,
  status,
  title,
  message,
  disclaimerTitle,
  requestButtonText,
  onRequest,
  onRefresh,
  onClose,
}: PermissionConfirmPopupProps) {
  const colors = useAppTheme();

  if (!visible || status === 'granted' || status === 'unavailable') {
    return null;
  }

  const displayTitle =
    status === 'not-determined' ? (disclaimerTitle ?? title) : title;

  const labelConfirm =
    status === 'not-determined'
      ? 'Continuar'
      : status === 'requestable'
        ? (requestButtonText ?? 'Permitir')
        : 'Abrir configuración';

  const labelCancel =
    status === 'blocked' ? 'Ya habilité el permiso' : 'Ahora no';

  const handleConfirm = () => {
    if (status === 'blocked') {
      void Linking.openSettings();
      return;
    }
    runAsync(onRequest);
  };

  const handleCancel = () => {
    if (status === 'blocked') {
      runAsync(onRefresh);
      return;
    }
    onClose();
  };

  return (
    <ConfirmPopup
      visible={visible}
      onRequestClose={handleCancel}
      title={displayTitle}
      labelConfirm={labelConfirm}
      labelCancel={labelCancel}
      onConfirm={handleConfirm}
    >
      <Text
        category="s1"
        appearance="hint"
        style={[styles.message, { color: colors.textSecondary }]}
      >
        {message}
      </Text>
    </ConfirmPopup>
  );
}

const styles = StyleSheet.create({
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
