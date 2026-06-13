import { StyleSheet, View, Pressable } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { Car } from '../../../../modules/user/types/car';
import Icon from '../../icons/Icon';
import CarHorizontalIcon from '../../../../../assets/images/icons/car-horizontal.svg';

export interface CarCardSelectProps {
  vehicle: Car;
  selected?: boolean;
  onSelect?: () => void;
  /** Separador superior entre ítems (misma banda que CarCardHorizontal). */
  showTopSeparator?: boolean;
}

export const CarCardSelect = ({
  vehicle,
  selected = false,
  onSelect,
  showTopSeparator = false,
}: CarCardSelectProps) => {
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

  const selectControl = (
    <View
      style={[
        styles.selectBtn,
        selected
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.backgroundTertiary },
      ]}
    >
      <Icon
        name={selected ? 'check' : 'circle'}
        size={selected ? 16 : 18}
        color={selected ? colors.white : colors.textDisabled}
        iconStyle={selected ? 'solid' : 'regular'}
      />
    </View>
  );

  const rowContent = (
    <>
      <View style={styles.iconWrap}>
        <CarHorizontalIcon width={80} height={52} />
      </View>
      {textBlock}
      {onSelect ? selectControl : null}
    </>
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
      {onSelect ? (
        <Pressable
          onPress={onSelect}
          style={styles.inner}
          android_ripple={{ color: rippleColor }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected }}
          accessibilityLabel={selected ? 'Vehículo seleccionado' : 'Seleccionar vehículo'}
        >
          {rowContent}
        </Pressable>
      ) : (
        <View style={styles.inner}>{rowContent}</View>
      )}
    </View>
  );
};

const SELECT_BTN_SIZE = 36;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    marginRight: 12,
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
  selectBtn: {
    width: SELECT_BTN_SIZE,
    height: SELECT_BTN_SIZE,
    flexShrink: 0,
    borderRadius: SELECT_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
