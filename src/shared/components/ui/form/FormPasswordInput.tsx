import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { formFieldStyles, useFormFieldTheme } from './formFieldStyles';
import { formatFormLabel } from './formatFormLabel';

export interface FormPasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  required?: boolean;
  containerRef?: React.RefObject<View | null>;
  onFocus?: () => void;
  style?: ViewProps['style'];
  inputStyle?: ViewProps['style'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: TextInputProps['returnKeyType'];
  blurOnSubmit?: TextInputProps['blurOnSubmit'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
}

export const FormPasswordInput = ({
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
  autoComplete = 'password',
  textContentType = 'password',
  inputRef,
  returnKeyType,
  blurOnSubmit,
  onSubmitEditing,
}: FormPasswordInputProps) => {
  const fieldTheme = useFormFieldTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const labelText = required ? label.replace(/\s*\*$/, '') : label;

  const toggleVisibility = useCallback(() => {
    setPasswordVisible((v) => !v);
  }, []);

  return (
    <View ref={containerRef as React.RefObject<View>} style={[formFieldStyles.wrapper, style]}>
      <View
        style={[
          formFieldStyles.container,
          fieldTheme.container,
          !disabled && fieldTheme.containerActive,
          disabled && formFieldStyles.containerDisabled,
        ]}
      >
        <Text
          style={[
            formFieldStyles.label,
            disabled ? fieldTheme.labelInactive : fieldTheme.labelActive,
          ]}
          numberOfLines={1}
        >
          {formatFormLabel(labelText)}
          {required ? <Text style={formFieldStyles.requiredAsterisk}> *</Text> : null}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={[formFieldStyles.input, fieldTheme.input, styles.passwordInput, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={
              disabled
                ? fieldTheme.placeholderInactiveColor
                : fieldTheme.placeholderActiveColor
            }
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            editable={!disabled}
            autoCapitalize="none"
            secureTextEntry={!passwordVisible}
            autoComplete={autoComplete}
            textContentType={textContentType}
            autoCorrect={false}
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            onSubmitEditing={onSubmitEditing}
          />
          <Pressable
            onPress={toggleVisibility}
            disabled={disabled}
            hitSlop={12}
            style={({ pressed }) => [styles.toggleBtn, pressed && styles.toggleBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={fieldTheme.iconColor}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /** Misma sensación de altura que un `TextInput` suelto en `FormInput` (sin fila extra). */
  passwordInput: {
    flex: 1,
    paddingVertical: 0,
    marginRight: 2,
    includeFontPadding: false,
  },
  toggleBtn: {
    marginLeft: 2,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnPressed: {
    opacity: 0.65,
  },
});
