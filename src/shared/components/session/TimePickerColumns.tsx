import { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';

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
}

function Column<T>({
  items: itemsList,
  value,
  valueToIndex,
  onSelect,
  colors,
}: {
  items: T[];
  value: T;
  valueToIndex: (v: T) => number;
  onSelect: (index: number) => void;
  colors: ReturnType<typeof useAppTheme>;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const index = valueToIndex(value);
  const safeIndex = Math.max(0, Math.min(index, itemsList.length - 1));

  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: safeIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [safeIndex]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const i = Math.round(y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(i, itemsList.length - 1));
      onSelect(clamped);
      scrollRef.current?.scrollTo({
        y: clamped * ITEM_HEIGHT,
        animated: true,
      });
    },
    [itemsList.length, onSelect],
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
        {itemsList.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text
              category="s1"
              style={[
                styles.itemText,
                { color: i === safeIndex ? colors.primary : colors.textSecondary },
              ]}
            >
              {String(item)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export const TimePickerColumns = ({ value, onChange }: TimePickerColumnsProps) => {
  const colors = useAppTheme();

  const onHourSelect = useCallback(
    (index: number) => {
      const hour = HOURS[index] ?? 12;
      onChange({ ...value, hour });
    },
    [value, onChange],
  );

  const onMinuteSelect = useCallback(
    (index: number) => {
      const minute = MINUTES[index] ?? 0;
      onChange({ ...value, minute });
    },
    [value, onChange],
  );

  const onAmpmSelect = useCallback(
    (index: number) => {
      const ampm = AMPM[index] ?? 'AM';
      onChange({ ...value, ampm });
    },
    [value, onChange],
  );

  return (
    <View style={styles.container}>
      <Column
        items={HOURS}
        value={value.hour}
        valueToIndex={v => HOURS.indexOf(v) >= 0 ? HOURS.indexOf(v) : 0}
        onSelect={onHourSelect}
        colors={colors}
      />
      <Column
        items={MINUTES}
        value={value.minute}
        valueToIndex={v => v}
        onSelect={onMinuteSelect}
        colors={colors}
      />
      <Column
        items={AMPM}
        value={value.ampm}
        valueToIndex={v => (v === 'AM' ? 0 : 1)}
        onSelect={onAmpmSelect}
        colors={colors}
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
