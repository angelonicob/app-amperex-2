import { useCallback, useRef, useState } from 'react';
import { InfoPopup } from '../components/ui/popup/InfoPopup';

type OpenState = {
  open: true;
  title: string;
  message: string;
  buttonTitle?: string;
};

type DialogState = { open: false } | OpenState;

/**
 * Diálogo informativo (un solo botón, p. ej. "Aceptar") basado en {@link InfoPopup}.
 */
export function useInfoDialog() {
  const [state, setState] = useState<DialogState>({ open: false });
  const onAfterAcceptRef = useRef<(() => void) | undefined>(undefined);

  const showInfo = useCallback(
    (
      title: string,
      message: string,
      opts?: { buttonTitle?: string; onAfterAccept?: () => void },
    ) => {
      onAfterAcceptRef.current = opts?.onAfterAccept;
      setState({
        open: true,
        title,
        message,
        buttonTitle: opts?.buttonTitle,
      });
    },
    [],
  );

  const handleAccept = useCallback(() => {
    const fn = onAfterAcceptRef.current;
    onAfterAcceptRef.current = undefined;
    setState({ open: false });
    fn?.();
  }, []);

  const InfoDialog =
    state.open ? (
      <InfoPopup
        visible
        title={state.title}
        message={state.message}
        buttonTitle={state.buttonTitle}
        onAccept={handleAccept}
      />
    ) : null;

  return { showInfo, InfoDialog };
}
