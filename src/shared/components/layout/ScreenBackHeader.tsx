/**
 * Barra bajo el header del drawer, para flujos de stack (formularios, etc.).
 */

import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import Icon from '../icons/Icon';
import { useAppTheme } from '../../theme/useAppTheme';

export interface ScreenBackHeaderProps {
  onBack: () => void;
  label?: string;
  title?: string;
}

export function ScreenBackHeader({ onBack, label = 'Volver', title }: ScreenBackHeaderProps) {
  const colors = useAppTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [styles.backPressable, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Icon
            name="chevron-left"
            size={16}
            color={colors.primary}
            iconStyle="solid"
            style={styles.icon}
          />
          <Text category="s1" style={[styles.backLabel, { color: colors.primary }]}>
            {label}
          </Text>
        </Pressable>
        {title ? (
          <Text
            category="s1"
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
        {title ? <View style={styles.backSpacer} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 88,
  },
  backSpacer: {
    minWidth: 88,
  },
  pressed: {
    opacity: 0.75,
  },
  icon: {
    marginRight: 4,
  },
  backLabel: {
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    paddingHorizontal: 8,
  },
});
