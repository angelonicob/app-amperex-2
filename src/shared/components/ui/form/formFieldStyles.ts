import { useTheme } from '@ui-kitten/components';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  BORDER_WIDTH,
  DISABLED_OPACITY,
} from '../../../constants/formConstants';
import { useAppTheme } from '../../../theme/useAppTheme';

/** Padding horizontal del contenedor del campo (misma caja que el `TextInput`). */
export const FORM_FIELD_CONTAINER_PADDING_H = 10;

/** Estilos base compartidos por campos de formulario (FormInput, FormPasswordInput, etc.). */
export const formFieldStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    borderWidth: BORDER_WIDTH,
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
    marginBottom: 1,
  },
  requiredAsterisk: {
    color: '#dc2626',
  },
  input: {
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
});

/** Colores del tema Eva para inputs, labels y bordes (claro / oscuro). */
export function useFormFieldTheme() {
  const theme = useTheme();
  const colors = useAppTheme();

  return useMemo(
    () => ({
      container: {
        borderColor: colors.border,
      },
      /** Borde más visible en campos habilitados (mismo tono que iconos del select). */
      containerActive: {
        borderColor: colors.textSecondary,
      },
      label: {
        color: colors.textSecondary,
      },
      labelActive: {
        color: colors.textSecondary,
      },
      labelInactive: {
        color: colors.textDisabled,
      },
      input: {
        color: theme['text-basic-color'],
      },
      placeholderColor: colors.textSecondary,
      placeholderActiveColor: colors.textSecondary,
      placeholderInactiveColor: colors.textDisabled,
      iconColor: colors.textSecondary,
      primaryColor: theme['color-primary-500'],
      dividerColor: colors.border,
    }),
    [theme, colors.border, colors.textDisabled, colors.textSecondary],
  );
}
