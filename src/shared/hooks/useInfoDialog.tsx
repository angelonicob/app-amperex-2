import { useCallback, useRef, useState } from 'react';
import { InfoPopup } from '../components/ui/popup/InfoPopup';

type DialogContent = {
  title: string;
  message: string;
  hint?: string;
  buttonTitle?: string;
};

/**
 * Diálogo informativo (un solo botón, p. ej. "Aceptar") basado en {@link InfoPopup}.
 */
export function useInfoDialog() {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<DialogContent | null>(null);
  const onAfterAcceptRef = useRef<(() => void) | undefined>(undefined);
  const pendingAfterAcceptRef = useRef<(() => void) | undefined>(undefined);

  const showInfo = useCallback(
    (
      title: string,
      message: string,
      opts?: {
        buttonTitle?: string;
        hint?: string;
        onAfterAccept?: () => void;
      },
    ) => {
      onAfterAcceptRef.current = opts?.onAfterAccept;
      setContent({
        title,
        message,
        hint: opts?.hint,
        buttonTitle: opts?.buttonTitle,
      });
      setVisible(true);
    },
    [],
  );

  const handleAccept = useCallback(() => {
    pendingAfterAcceptRef.current = onAfterAcceptRef.current;
    onAfterAcceptRef.current = undefined;
    setVisible(false);
  }, []);

  const handleDismissed = useCallback(() => {
    setContent(null);
    const fn = pendingAfterAcceptRef.current;
    pendingAfterAcceptRef.current = undefined;
    fn?.();
  }, []);

  const InfoDialog = content ? (
    <InfoPopup
      visible={visible}
      onDismissed={handleDismissed}
      title={content.title}
      message={content.message}
      hint={content.hint}
      buttonTitle={content.buttonTitle}
      onAccept={handleAccept}
    />
  ) : null;

  return { showInfo, InfoDialog };
}
