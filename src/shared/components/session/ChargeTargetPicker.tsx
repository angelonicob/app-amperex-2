import { Input, Layout, Text } from '@ui-kitten/components';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { MetaCharge } from './MetaCharge';

export type ChargeTargetPickerProps = {
  displayValue: string;
  inputValue: string;
  onChangeInput: (text: string) => void;
  suggestions: readonly number[];
  formatSuggestion: (amount: number) => string;
  suggestionSubtitle?: (amount: number) => string;
  isSuggestionSelected: (amount: number) => boolean;
  onSelectSuggestion: (amount: number) => void;
  placeholder: string;
  keyboardType?: 'numeric' | 'decimal-pad';
  onInputFocus?: () => void;
  estimate?: string | null;
};

export const ChargeTargetPicker = ({
  displayValue,
  inputValue,
  onChangeInput,
  suggestions,
  formatSuggestion,
  suggestionSubtitle,
  isSuggestionSelected,
  onSelectSuggestion,
  placeholder,
  keyboardType = 'numeric',
  onInputFocus,
  estimate,
}: ChargeTargetPickerProps) => {
  const colors = useAppTheme();

  const handleFocus = () => {
    onInputFocus?.();
  };

  return (
    <View style={styles.root}>
      <MetaCharge value={displayValue} icon={displayValue.includes('kWh') ? 'energy' : null} />

      {estimate ? (
        <Text
          category="s2"
          appearance="hint"
          style={[styles.estimate, { color: colors.textSecondary }]}
        >
          {estimate}
        </Text>
      ) : null}

      <Text category="label" appearance="hint" style={styles.suggestionsLabel}>
        Sugerencias
      </Text>
      <View style={styles.suggestionGrid}>
        {suggestions.map((amount) => {
          const selected = isSuggestionSelected(amount);
          return (
            <Pressable
              key={amount}
              onPress={() => onSelectSuggestion(amount)}
              style={({ pressed }) => [
                styles.suggestionPressable,
                pressed && styles.suggestionPressed,
              ]}
            >
              <Layout
                level="2"
                style={[
                  styles.suggestionCard,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected
                      ? colors.isDark
                        ? 'rgba(255, 61, 113, 0.12)'
                        : 'rgba(255, 61, 113, 0.08)'
                      : undefined,
                  },
                ]}
              >
                <Text
                  category="s1"
                  style={[
                    styles.suggestionTitle,
                    selected ? { color: colors.primary } : { color: colors.text },
                  ]}
                >
                  {suggestionSubtitle
                    ? suggestionSubtitle(amount)
                    : formatSuggestion(amount)}
                </Text>
              </Layout>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.inputBlock}>
        <Text category="label" appearance="hint" style={styles.inputLabel}>
          Otro valor
        </Text>
        <Input
          value={inputValue}
          onChangeText={onChangeInput}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          textStyle={[styles.inputText, { color: colors.text }]}
          keyboardType={keyboardType}
          style={[styles.input, { borderColor: colors.border }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  estimate: {
    marginTop: -8,
    textAlign: 'center',
    fontWeight: '600',
  },
  suggestionsLabel: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  suggestionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  suggestionPressable: {
    width: '30%',
    minWidth: 96,
    maxWidth: 120,
  },
  suggestionPressed: {
    opacity: 0.85,
  },
  suggestionCard: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  suggestionTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  inputBlock: {
    width: '100%',
    gap: 8,
  },
  inputLabel: {
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
  },
  inputText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
