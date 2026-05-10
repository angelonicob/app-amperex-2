import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { Car } from '../../../../modules/user/types/car';
import Icon from '../../../components/icons/Icon';
import CarHorizontalIcon from '../../../../../assets/images/icons/car-horizontal.svg';

export interface CarCardHorizontalProps {
  vehicle: Car;
  onPress?: () => void;
  onDeletePress?: () => void;
}

export const CarCardHorizontal = ({
  vehicle,
  onPress,
  onDeletePress,
}: CarCardHorizontalProps) => {
  const colors = useAppTheme();

  const textBlock = (
    <View style={styles.textBlock}>
      <Text category="s1" style={[styles.title, { color: colors.primary }]} numberOfLines={1}>
        {vehicle.brand} {vehicle.model}
      </Text>
      <Text category="p2" style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {vehicle.variant.name} · {vehicle.variant.yearFrom}
        {vehicle.variant.yearTo !== vehicle.variant.yearFrom ? ` - ${vehicle.variant.yearTo}` : ''}
      </Text>
    </View>
  );

  const leftContent = (
    <View style={styles.leftRow}>
      <CarHorizontalIcon width={72} height={48} style={styles.image} />
      {textBlock}
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            style={styles.leftTap}
            android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          >
            {leftContent}
          </Pressable>
        ) : (
          <View style={styles.leftTap}>{leftContent}</View>
        )}
        {onDeletePress ? (
          <Pressable
            onPress={onDeletePress}
            style={styles.deleteBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Eliminar vehículo"
          >
            <Icon
              name="trash-can"
              size={20}
              color={colors.danger}
              iconStyle="solid"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftTap: {
    flex: 1,
    minWidth: 0,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 48,
    marginRight: 16,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
  },
});
