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
  /** Separador superior entre ítems (misma banda que HistoryCard). */
  showTopSeparator?: boolean;
}

export const CarCardHorizontal = ({
  vehicle,
  onPress,
  onDeletePress,
  showTopSeparator = false,
}: CarCardHorizontalProps) => {
  const colors = useAppTheme();
  const rippleColor = colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  const yearLabel =
    vehicle.variant.yearTo !== vehicle.variant.yearFrom
      ? `${vehicle.variant.yearFrom} - ${vehicle.variant.yearTo}`
      : String(vehicle.variant.yearFrom);

  const textBlock = (
    <View style={styles.textBlock}>
      <Text
        category="s1"
        numberOfLines={1}
        style={[styles.title, { color: colors.text }]}
      >
        {vehicle.brand} {vehicle.model}
      </Text>
      <View style={styles.variantRow}>
        <Text
          category="s1"
          numberOfLines={1}
          style={[styles.variant, { color: colors.text }]}
        >
          {vehicle.variant.name}
          <Text style={{ color: colors.textSecondary }}>
            {' · '}
            {yearLabel}
          </Text>
        </Text>
      </View>
      <Text
        category="p2"
        numberOfLines={1}
        style={[styles.plate, { color: colors.textSecondary }]}
      >
        {vehicle.plate}
      </Text>
    </View>
  );

  const leftContent = (
    <View style={styles.leftRow}>
      <View style={styles.iconWrap}>
        <CarHorizontalIcon width={80} height={52} />
      </View>
      {textBlock}
    </View>
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.background },
        showTopSeparator && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.backgroundTertiary,
        },
      ]}
    >
      <View style={styles.inner}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            style={styles.leftTap}
            android_ripple={{ color: rippleColor }}
          >
            {leftContent}
          </Pressable>
        ) : (
          <View style={styles.leftTap}>{leftContent}</View>
        )}
        {onDeletePress ? (
          <Pressable
            onPress={onDeletePress}
            style={[
              styles.deleteBtn,
              {
                backgroundColor: colors.isDark
                  ? 'rgba(255, 61, 113, 0.12)'
                  : 'rgba(255, 61, 113, 0.08)',
              },
            ]}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftTap: {
    flex: 1,
    minWidth: 0,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginBottom: 2,
  },
  variant: {
    fontSize: 14,
    fontWeight: '500',
  },
  plate: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 10,
  },
});
