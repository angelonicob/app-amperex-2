import { useCallback, useRef, useState } from 'react';
import { Text } from '@ui-kitten/components';
import { ConfirmPopup } from '../components/ui/popup/ConfirmPopup';

export type ShowConfirmOptions = {
  title?: string;
  message: string;
  labelConfirm: string;
  labelCancel?: string;
  confirmDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

type DialogContent = Omit<ShowConfirmOptions, 'onConfirm'>;

/**
 * Diálogo de confirmación (cancelar + confirmar) basado en {@link ConfirmPopup}.
 */
export function useConfirmDialog() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<DialogContent | null>(null);
  const onConfirmRef = useRef<(() => void | Promise<void>) | null>(null);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  const clearContent = useCallback(() => {
    onConfirmRef.current = null;
    setContent(null);
  }, []);

  const showConfirm = useCallback((opts: ShowConfirmOptions) => {
    const { onConfirm, ...rest } = opts;
    onConfirmRef.current = onConfirm;
    setContent(rest);
    setVisible(true);
  }, []);

  const handleConfirmPress = useCallback(() => {
    const fn = onConfirmRef.current;
    void Promise.resolve(fn?.()).finally(() => {
      hide();
    });
  }, [hide]);

  const ConfirmDialog = content ? (
    <ConfirmPopup
      visible={visible}
      onDismissed={clearContent}
      title={content.title}
      onRequestClose={hide}
      labelConfirm={content.labelConfirm}
      labelCancel={content.labelCancel}
      confirmDestructive={content.confirmDestructive}
      loading={content.loading}
      onConfirm={handleConfirmPress}
    >
      <Text category="s1" appearance="hint">
        {content.message}
      </Text>
    </ConfirmPopup>
  ) : null;

  return { showConfirm, hideConfirm: hide, ConfirmDialog };
}
