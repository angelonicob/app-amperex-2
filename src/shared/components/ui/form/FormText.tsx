import { StyleSheet, Text, TextInput, View, ViewProps } from 'react-native';
import {
  BORDER_COLOR,
  BORDER_WIDTH,
  DISABLED_OPACITY,
  LABEL_COLOR,
  PLACEHOLDER_COLOR,
} from '../../../constants/formConstants';
import { formatFormLabel } from './formatFormLabel';

export interface FormTextProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  containerRef?: React.RefObject<View | null>;
  onFocus?: () => void;
  style?: ViewProps['style'];
  inputStyle?: ViewProps['style'];
  /** Número de líneas visibles (altura aproximada). Default 4. */
  numberOfLines?: number;
  /** Altura mínima del área de texto. Default 80. */
  minHeight?: number;
}

export const FormText = ({
  label,
  placeholder,
  value,
  onChangeText,
  disabled = false,
  containerRef,
  onFocus,
  style,
  inputStyle,
  numberOfLines = 4,
  minHeight = 80,
}: FormTextProps) => {
  return (
    <View ref={containerRef as React.RefObject<View>} style={[styles.wrapper, style]}>
      <View style={[styles.container, disabled && styles.containerDisabled]}>
        <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={1}>
          {formatFormLabel(label)}
        </Text>
        <TextInput
          style={[styles.input, { minHeight }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          editable={!disabled}
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
        />
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  containerDisabled: {
    opacity: DISABLED_OPACITY,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: LABEL_COLOR,
    marginBottom: 4,
  },
  labelDisabled: {
    color: LABEL_COLOR,
  },
  input: {
    fontSize: 16,
    color: '#111827',
    padding: 0,
    margin: 0,
  },
});
