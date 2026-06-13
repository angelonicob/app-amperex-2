import { Text } from '@ui-kitten/components';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from '../icons/Icon';
import { useAppTheme } from '../../theme/useAppTheme';
import {
  LEGAL_PRIVACY_TITLE,
  LEGAL_PRIVACY_URL,
  LEGAL_TERMS_TITLE,
  LEGAL_TERMS_URL,
} from '../../config/legal';
import { openLegalDocument } from '../../../presentation/routes/openLegalDocument';

export type TermsAcceptanceRowProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function TermsAcceptanceRow({
  checked,
  onCheckedChange,
  disabled = false,
}: TermsAcceptanceRowProps) {
  const colors = useAppTheme();
  const linkStyle = { color: colors.primary, fontWeight: '700' as const };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel="Aceptar política de privacidad y términos de uso"
        onPress={() => {
          if (!disabled) onCheckedChange(!checked);
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.checkbox,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
            opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {checked ? (
          <Icon name="check" size={12} color="#FFFFFF" iconStyle="solid" />
        ) : null}
      </Pressable>

      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Acepto la{' '}
        <Text
          onPress={() =>
            openLegalDocument(LEGAL_PRIVACY_URL, LEGAL_PRIVACY_TITLE)
          }
          style={linkStyle}
        >
          política de privacidad
        </Text>{' '}
        y los{' '}
        <Text
          onPress={() =>
            openLegalDocument(LEGAL_TERMS_URL, LEGAL_TERMS_TITLE)
          }
          style={linkStyle}
        >
          términos y condiciones de uso
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});
