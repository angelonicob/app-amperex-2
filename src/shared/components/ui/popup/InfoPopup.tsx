import { Text } from '@ui-kitten/components';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ButtonPrimary } from '../button';
import { useAppTheme } from '../../../theme/useAppTheme';
import { popupTemplateStyles, withPopupInsets } from './popupStyles';

export type InfoPopupProps = {
  visible: boolean;
  title: string;
  message: string;
  /** Texto del botón principal (p. ej. "Aceptar"). */
  buttonTitle?: string;
  /** Al pulsar: cerrar modal y reactivar el escáner (lo invoca la pantalla). */
  onAccept: () => void;
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
}: InfoPopupProps) => {
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
            <Text
              category="h5"
              style={[popupTemplateStyles.title, { color: theme.text }]}
            >
              {title}
            </Text>
            <Text category="s1" appearance="hint" style={popupTemplateStyles.body}>
              {message}
            </Text>
            <ButtonPrimary
              title={buttonTitle}
              onPress={onAccept}
              style={popupTemplateStyles.button}
            />
          </View>
        </Pressable>
      </View>
    </Modal>
  );
};
