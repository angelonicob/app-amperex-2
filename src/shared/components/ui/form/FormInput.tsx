import {
  Text,
  TextInput,
  type TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { formFieldStyles, PLACEHOLDER_COLOR } from './formFieldStyles';
import { formatFormLabel } from './formatFormLabel';

export interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  /** Si es true, se muestra un asterisco rojo después del label (para campos obligatorios). */
  required?: boolean;
  containerRef?: React.RefObject<View | null>;
  onFocus?: () => void;
  style?: ViewProps['style'];
  inputStyle?: ViewProps['style'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  autoCorrect?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: TextInputProps['returnKeyType'];
  blurOnSubmit?: TextInputProps['blurOnSubmit'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
}

export const FormInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  disabled = false,
  required = false,
  containerRef,
  onFocus,
  style,
  inputStyle,
  autoCapitalize = 'none',
  keyboardType = 'default',
  secureTextEntry,
  autoComplete,
  textContentType,
  autoCorrect,
  inputRef,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
}: FormInputProps) => {
  const labelText = required ? label.replace(/\s*\*$/, '') : label;
  return (
    <View ref={containerRef as React.RefObject<View>} style={[formFieldStyles.wrapper, style]}>
      <View
        style={[
          formFieldStyles.container,
          disabled && formFieldStyles.containerDisabled,
        ]}
      >
        <Text
          style={[formFieldStyles.label, disabled && formFieldStyles.labelDisabled]}
          numberOfLines={1}
        >
          {formatFormLabel(labelText)}
          {required ? <Text style={formFieldStyles.requiredAsterisk}> *</Text> : null}
        </Text>
        <TextInput
          ref={inputRef}
          style={[formFieldStyles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          editable={!disabled}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          blurOnSubmit={blurOnSubmit}
          onSubmitEditing={onSubmitEditing}
        />
      </View>
    </View>
  );
};
