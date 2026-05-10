import { StyleSheet } from 'react-native';
import {
  BORDER_COLOR,
  BORDER_WIDTH,
  DISABLED_OPACITY,
  LABEL_COLOR,
  PLACEHOLDER_COLOR,
} from '../../../constants/formConstants';

/** Padding horizontal del contenedor del campo (misma caja que el `TextInput`). */
export const FORM_FIELD_CONTAINER_PADDING_H = 10;

/** Estilos base compartidos por campos de formulario (FormInput, FormPasswordInput, etc.). */
export const formFieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: FORM_FIELD_CONTAINER_PADDING_H,
    paddingVertical: 6,
    minHeight: 52,
    justifyContent: 'center',
  },
  containerDisabled: {
    opacity: DISABLED_OPACITY,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: LABEL_COLOR,
    marginBottom: 1,
  },
  labelDisabled: {
    color: LABEL_COLOR,
  },
  requiredAsterisk: {
    color: '#dc2626',
  },
  input: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
});

export { PLACEHOLDER_COLOR };
