import { useCallback, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import type { DepartureTimeBounds } from '../../utils/departureTime';
import {
  clampDepartureTime,
  isDepartureTimeOptionValid,
} from '../../utils/departureTime';

const ITEM_HEIGHT = 36;
const VISIBLE_HEIGHT = 5 * ITEM_HEIGHT;
const PADDING_Y = (VISIBLE_HEIGHT - ITEM_HEIGHT) / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const AMPM: ('AM' | 'PM')[] = ['AM', 'PM'];

export interface TimePickerColumnsValue {
  hour: number;
  minute: number;
  ampm: 'AM' | 'PM';
}

export interface TimePickerColumnsProps {
  value: TimePickerColumnsValue;
  onChange: (value: TimePickerColumnsValue) => void;
  /** Si se define, colorea y limita opciones al rango permitido (minutos 24h). */
  bounds?: DepartureTimeBounds;
  /** Validación fina (p. ej. solapamiento con reservas + gracia). Tiene prioridad sobre bounds simple. */
  isOptionValid?: (
    hour: number,
    minute: number,
    ampm: 'AM' | 'PM',
  ) => boolean;
}

function Column<T>({
  items: itemsList,
  value,
  valueToIndex,
  onSelect,
  colors,
  isItemEnabled,
}: {
  items: T[];
  value: T;
  valueToIndex: (v: T) => number;
  onSelect: (index: number) => void;
  colors: ReturnType<typeof useAppTheme>;
  isItemEnabled?: (item: T, index: number) => boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const index = valueToIndex(value);
  const safeIndex = Math.max(0, Math.min(index, itemsList.length - 1));
  /** Última posición a la que pedimos scrollTo programáticamente. Evita disparar scrolls redundantes. */
  const lastScrolledIndexRef = useRef<number | null>(null);
  /** Marca un scroll iniciado por el usuario para usar animación en el snap externo. */
  const isUserScrollRef = useRef(false);

  useEffect(() => {
    if (lastScrolledIndexRef.current === safeIndex) return;
    const target = safeIndex * ITEM_HEIGHT;
    const animated = isUserScrollRef.current;
    isUserScrollRef.current = false;
    lastScrolledIndexRef.current = safeIndex;
    scrollRef.current?.scrollTo({ y: target, animated });
  }, [safeIndex]);

  const findNearestEnabledIndex = useCallback(
    (fromIndex: number): number => {
      if (!isItemEnabled) return fromIndex;
      if (isItemEnabled(itemsList[fromIndex]!, fromIndex)) return fromIndex;
      for (let d = 1; d < itemsList.length; d++) {
        const lo = fromIndex - d;
        const hi = fromIndex + d;
        if (lo >= 0 && isItemEnabled(itemsList[lo]!, lo)) return lo;
        if (hi < itemsList.length && isItemEnabled(itemsList[hi]!, hi)) return hi;
      }
      return fromIndex;
    },
    [isItemEnabled, itemsList],
  );

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const i = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(i, itemsList.length - 1));
      const enabledIndex = findNearestEnabledIndex(clamped);
      if (enabledIndex !== safeIndex) {
        // El padre actualizará `value`; el useEffect se encargará del snap (animado).
        isUserScrollRef.current = true;
        onSelect(enabledIndex);
        return;
      }
      // El value no cambió. Si caímos sobre un slot disabled, realineamos manualmente.
      if (enabledIndex !== clamped) {
        lastScrolledIndexRef.current = enabledIndex;
        scrollRef.current?.scrollTo({
          y: enabledIndex * ITEM_HEIGHT,
          animated: true,
        });
      }
    },
    [findNearestEnabledIndex, itemsList.length, onSelect, safeIndex],
  );

  return (
    <View style={[styles.columnWrap, { height: VISIBLE_HEIGHT }]}>
      <View style={[styles.centerLine, { borderColor: colors.primary }]} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.columnContent}
        onMomentumScrollEnd={onScrollEnd}
      >
        {itemsList.map((item, i) => {
          const enabled = isItemEnabled ? isItemEnabled(item, i) : true;
          const isSelected = i === safeIndex;
          const textColor = !enabled
            ? colors.textDisabled
            : isSelected
              ? colors.primary
              : colors.text;
          return (
            <View key={i} style={styles.item}>
              <Text
                category="s1"
                style={[
                  styles.itemText,
                  {
                    color: textColor,
                    opacity: enabled ? 1 : 0.45,
                    fontWeight: isSelected && enabled ? '700' : '500',
                  },
                ]}
              >
                {String(item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const TimePickerColumns = ({
  value,
  onChange,
  bounds,
  isOptionValid,
}: TimePickerColumnsProps) => {
  const colors = useAppTheme();

  const optionOk = useCallback(
    (hour: number, minute: number, ampm: 'AM' | 'PM') => {
      if (isOptionValid) return isOptionValid(hour, minute, ampm);
      if (bounds) return isDepartureTimeOptionValid(hour, minute, ampm, bounds);
      return true;
    },
    [bounds, isOptionValid],
  );

  const isHourEnabled = useCallback(
    (hour: number) => {
      if (!bounds && !isOptionValid) return true;
      return MINUTES.some((minute) =>
        AMPM.some((ampm) => optionOk(hour, minute, ampm)),
      );
    },
    [bounds, isOptionValid, optionOk],
  );

  const isMinuteEnabled = useCallback(
    (minute: number) => {
      if (!bounds && !isOptionValid) return true;
      return optionOk(value.hour, minute, value.ampm);
    },
    [bounds, isOptionValid, optionOk, value.hour, value.ampm],
  );

  const isAmpmEnabled = useCallback(
    (ampm: 'AM' | 'PM') => {
      if (!bounds && !isOptionValid) return true;
      return MINUTES.some((minute) => optionOk(value.hour, minute, ampm));
    },
    [bounds, isOptionValid, optionOk, value.hour],
  );

  const emitChange = useCallback(
    (next: TimePickerColumnsValue) => {
      if (bounds) {
        onChange(clampDepartureTime(next, bounds));
      } else {
        onChange(next);
      }
    },
    [bounds, onChange],
  );

  const onHourSelect = useCallback(
    (index: number) => {
      const hour = HOURS[index] ?? 12;
      emitChange({ ...value, hour });
    },
    [value, emitChange],
  );

  const onMinuteSelect = useCallback(
    (index: number) => {
      const minute = MINUTES[index] ?? 0;
      emitChange({ ...value, minute });
    },
    [value, emitChange],
  );

  const onAmpmSelect = useCallback(
    (index: number) => {
      const ampm = AMPM[index] ?? 'AM';
      emitChange({ ...value, ampm });
    },
    [value, emitChange],
  );

  const showDisabled = bounds != null || isOptionValid != null;

  const hourEnabledChecker = useMemo(
    () => (showDisabled ? (item: number) => isHourEnabled(item) : undefined),
    [showDisabled, isHourEnabled],
  );

  const minuteEnabledChecker = useMemo(
    () => (showDisabled ? (item: number) => isMinuteEnabled(item) : undefined),
    [showDisabled, isMinuteEnabled],
  );

  const ampmEnabledChecker = useMemo(
    () => (showDisabled ? (item: 'AM' | 'PM') => isAmpmEnabled(item) : undefined),
    [showDisabled, isAmpmEnabled],
  );

  return (
    <View style={styles.container}>
      <Column
        items={HOURS}
        value={value.hour}
        valueToIndex={v => HOURS.indexOf(v) >= 0 ? HOURS.indexOf(v) : 0}
        onSelect={onHourSelect}
        colors={colors}
        isItemEnabled={hourEnabledChecker}
      />
      <Column
        items={MINUTES}
        value={value.minute}
        valueToIndex={v => v}
        onSelect={onMinuteSelect}
        colors={colors}
        isItemEnabled={minuteEnabledChecker}
      />
      <Column
        items={AMPM}
        value={value.ampm}
        valueToIndex={v => (v === 'AM' ? 0 : 1)}
        onSelect={onAmpmSelect}
        colors={colors}
        isItemEnabled={ampmEnabledChecker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  columnWrap: {
    width: 56,
    justifyContent: 'center',
    position: 'relative',
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (VISIBLE_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
    pointerEvents: 'none',
  },
  columnContent: {
    paddingVertical: PADDING_Y,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
