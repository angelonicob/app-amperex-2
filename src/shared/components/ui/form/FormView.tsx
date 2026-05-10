import {
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewProps,
} from 'react-native';
import {
  BORDER_COLOR,
  BORDER_WIDTH,
  DISABLED_OPACITY,
  LABEL_COLOR,
  PLACEHOLDER_COLOR,
} from '../../../constants/formConstants';
import { formatFormLabel } from './formatFormLabel';

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
  const labelText = required ? label.replace(/\s*\*$/, '') : label;
  const trimmed = value?.trim() ?? '';
  const display = trimmed !== '' ? trimmed : emptyText;
  const isEmpty = trimmed === '';

  return (
    <View style={[styles.wrapper, style]}>
      <View style={[styles.container, disabled && styles.containerDisabled]}>
        <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={1}>
          {formatFormLabel(labelText)}
          {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
        </Text>
        <Text
          style={[
            styles.value,
            isEmpty && styles.valueEmpty,
            disabled && styles.valueDisabled,
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
  wrapper: {
    marginBottom: 12,
  },
  container: {
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 10,
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
  value: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
  valueEmpty: {
    color: PLACEHOLDER_COLOR,
  },
  valueDisabled: {
    color: '#111827',
  },
});
