import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '@ui-kitten/components';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/useAppTheme';

export interface HeaderFlowProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export const HeaderFlow = ({ title, subtitle, onBack }: HeaderFlowProps) => {
  const colors = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <FontAwesome6 name="chevron-left" size={15} color={colors.white} />
          </Pressable>
        ) : null}
        <Text category="h5" style={[styles.title, { color: colors.primary }]}>
          {title}
        </Text>
      </View>
      <Text category="s1" style={[styles.subtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
});
