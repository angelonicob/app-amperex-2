import { Layout, Text } from '@ui-kitten/components';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { PermissionState } from '../../../modules/permissions/types';
import { useAppTheme } from '../../theme/useAppTheme';

export type PermissionPromptModalProps = {
  visible: boolean;
  status: PermissionState;
  title: string;
  message: string;
  screenName?: string;
  disclaimerTitle?: string;
  requestButtonText?: string;
  onRequest: () => void | Promise<unknown>;
  onRefresh: () => void | Promise<unknown>;
  onClose: () => void;
};

export function PermissionPromptModal({
  visible,
  status,
  title,
  message,
  screenName,
  disclaimerTitle,
  requestButtonText,
  onRequest,
  onRefresh,
  onClose,
}: PermissionPromptModalProps) {
  const colors = useAppTheme();

  if (!visible || status === 'granted' || status === 'unavailable') {
    return null;
  }

  const run = (fn: () => void | Promise<unknown>) => {
    const result = fn();
    if (result instanceof Promise) {
      result.catch(() => {});
    }
  };

  const primaryLabel =
    status === 'not-determined'
      ? 'Continuar'
      : status === 'requestable'
        ? (requestButtonText ?? 'Permitir')
        : 'Abrir configuración';

  const handlePrimary = () => {
    if (status === 'blocked') {
      void Linking.openSettings();
      return;
    }
    run(onRequest);
  };

  const displayTitle =
    status === 'not-determined' ? (disclaimerTitle ?? title) : title;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.dialogWrap} onPress={() => {}}>
          <Layout
            level="2"
            style={[styles.card, { borderColor: colors.border }]}
          >
            {screenName ? (
              <Text category="c1" appearance="hint" style={styles.screenName}>
                {screenName}
              </Text>
            ) : null}
            <Text category="h6" style={[styles.title, { color: colors.text }]}>
              {displayTitle}
            </Text>
            <Text
              category="s1"
              appearance="hint"
              style={[styles.message, { color: colors.textSecondary }]}
            >
              {message}
            </Text>

            <Pressable
              onPress={handlePrimary}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </Pressable>

            {status === 'blocked' ? (
              <Pressable onPress={() => run(onRefresh)} style={styles.secondaryBtn}>
                <Text category="s1" style={{ color: colors.primary }}>
                  Ya habilité el permiso
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={styles.secondaryBtn}>
                <Text category="s1" appearance="hint">
                  Ahora no
                </Text>
              </Pressable>
            )}
          </Layout>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    padding: 24,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  screenName: {
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 4,
  },
});
