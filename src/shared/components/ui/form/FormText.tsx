import { StyleSheet, Text, TextInput, View, ViewProps } from 'react-native';
import { formatFormLabel } from './formatFormLabel';
import { formFieldStyles, useFormFieldTheme } from './formFieldStyles';

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
  const fieldTheme = useFormFieldTheme();

  return (
    <View ref={containerRef as React.RefObject<View>} style={[formFieldStyles.wrapper, style]}>
      <View
        style={[
          formFieldStyles.container,
          styles.textContainer,
          fieldTheme.container,
          disabled && formFieldStyles.containerDisabled,
        ]}
      >
        <Text style={[formFieldStyles.label, fieldTheme.label]} numberOfLines={1}>
          {formatFormLabel(label)}
        </Text>
        <TextInput
          style={[formFieldStyles.input, fieldTheme.input, { minHeight }, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={fieldTheme.placeholderColor}
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
  textContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
