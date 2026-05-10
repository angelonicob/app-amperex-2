import { StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import { FontAwesome6 } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

export interface MetaChargeProps {
  value: string;
  icon?: 'energy' | null;
}

export const MetaCharge = ({ value, icon = null }: MetaChargeProps) => {
  const colors = useAppTheme();
  const { width } = useWindowDimensions();
  const boxSize = Math.min(width * 0.6, 190);

  return (
    <View
      style={[
        styles.container,
        {
          width: boxSize,
          height: boxSize,
          borderColor: colors.primary,
        },
      ]}
    >
      {icon === 'energy' ? (
        <FontAwesome6
          name="bolt"
          size={22}
          color={colors.primary}
          style={styles.icon}
        />
      ) : null}
      <Text category="h6" style={[styles.value, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 7,
  },
  icon: {
    marginRight: 8,
  },
  value: {
    fontWeight: '700',
    fontSize: 20,
  },
});
