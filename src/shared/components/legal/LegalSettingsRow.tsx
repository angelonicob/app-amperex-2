import { Layout, Text } from '@ui-kitten/components';
import { Pressable, StyleSheet } from 'react-native';
import Icon from '../icons/Icon';
import { useAppTheme } from '../../theme/useAppTheme';

export type LegalSettingsRowProps = {
  title: string;
  onPress: () => void;
};

export function LegalSettingsRow({ title, onPress }: LegalSettingsRowProps) {
  const colors = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <Layout
        level="2"
        style={[
          styles.row,
          {
            borderColor: colors.border,
            backgroundColor: colors.isDark
              ? colors.backgroundTertiary
              : colors.backgroundSecondary,
          },
        ]}
      >
        <Text category="s1" style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        <Icon
          name="chevron-right"
          size={14}
          color={colors.textSecondary}
          iconStyle="solid"
        />
      </Layout>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
});
