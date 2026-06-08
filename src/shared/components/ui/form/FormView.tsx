import {
  StyleSheet,
  Text,
  type TextStyle,
  View,
  ViewProps,
} from 'react-native';
import { formatFormLabel } from './formatFormLabel';
import { formFieldStyles, useFormFieldTheme } from './formFieldStyles';

export interface FormViewProps {
  label: string;
  /** Texto mostrado; si está vacío o solo espacios, se usa `emptyText`. */
  value: string | null | undefined;
  /** Si es true, se muestra un asterisco rojo después del label (coherente con FormInput). */
  required?: boolean;
  disabled?: boolean;
  /** Texto cuando `value` no aplica (por defecto «No especificado»). */
  emptyText?: string;
  style?: ViewProps['style'];
  valueStyle?: TextStyle;
}

export const FormView = ({
  label,
  value,
  required = false,
  disabled = false,
  emptyText = 'No especificado',
  style,
  valueStyle,
}: FormViewProps) => {
  const fieldTheme = useFormFieldTheme();
  const labelText = required ? label.replace(/\s*\*$/, '') : label;
  const trimmed = value?.trim() ?? '';
  const display = trimmed !== '' ? trimmed : emptyText;
  const isEmpty = trimmed === '';

  return (
    <View style={[formFieldStyles.wrapper, style]}>
      <View
        style={[
          formFieldStyles.container,
          fieldTheme.container,
          disabled && formFieldStyles.containerDisabled,
        ]}
      >
        <Text style={[formFieldStyles.label, fieldTheme.label]} numberOfLines={1}>
          {formatFormLabel(labelText)}
          {required ? <Text style={formFieldStyles.requiredAsterisk}> *</Text> : null}
        </Text>
        <Text
          style={[
            styles.value,
            fieldTheme.input,
            isEmpty && { color: fieldTheme.placeholderColor },
            valueStyle,
          ]}
        >
          {display}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  value: {
    padding: 0,
    margin: 0,
  },
});
