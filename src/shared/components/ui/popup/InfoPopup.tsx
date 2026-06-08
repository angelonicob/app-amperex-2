import { Text } from '@ui-kitten/components';
import { ButtonPrimary } from '../button';
import { popupTemplateStyles } from './popupStyles';
import { PopupShell } from './PopupShell';

export type InfoPopupProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Texto del botón principal (p. ej. "Aceptar"). */
  buttonTitle?: string;
  /** Al pulsar: cerrar modal y reactivar el escáner (lo invoca la pantalla). */
  onAccept: () => void;
  /** Se invoca tras completar la animación de cierre. */
  onDismissed?: () => void;
};

/**
 * Modal informativo genérico: no se cierra tocando el fondo ni con botón atrás.
 */
export const InfoPopup = ({
  visible,
  title,
  message,
  buttonTitle = 'Aceptar',
  onAccept,
  onDismissed,
}: InfoPopupProps) => (
  <PopupShell
    visible={visible}
    onRequestClose={() => {}}
    onDismissed={onDismissed}
    title={title}
    footer={
      <ButtonPrimary
        title={buttonTitle}
        onPress={onAccept}
        style={popupTemplateStyles.button}
      />
    }
  >
    <Text category="s1" appearance="hint" style={popupTemplateStyles.body}>
      {message}
    </Text>
  </PopupShell>
);
