import { Text } from '@ui-kitten/components';
import type React from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_HORIZONTAL_PADDING } from '../../../theme/theme';
import { ButtonPrimary } from '../button';
import { useAppTheme } from '../../../theme/useAppTheme';

export type ModalPopupProps = {
  visible: boolean;
  onClose?: () => void;
  image?: ImageSourcePropType;
  imageNode?: React.ReactNode;
  title: string;
  text: string;
  buttonTitle: string;
  onButtonPress: () => void;
};

/**
 * Modal con fondo semitransparente e inseto lateral igual al padding de contenido
 * del perfil (`CONTENT_HORIZONTAL_PADDING`).
 */
export const ModalPopup = ({
  visible,
  onClose,
  image,
  imageNode,
  title,
  text,
  buttonTitle,
  onButtonPress,
}: ModalPopupProps) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
          },
        ]}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={styles.cardHitSlop}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            {imageNode ?? (image ? (
              <Image source={image} style={styles.image} resizeMode="contain" />
            ) : null)}
            <Text
              category="h5"
              style={[styles.title, { color: theme.text }]}
            >
              {title}
            </Text>
            <Text category="s1" appearance="hint" style={styles.body}>
              {text}
            </Text>
            <ButtonPrimary
              title={buttonTitle}
              onPress={onButtonPress}
              style={styles.button}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  cardHitSlop: {
    width: '100%',
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: CONTENT_HORIZONTAL_PADDING,
    width: '100%',
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
});
