import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import type { SessionHistoryItem } from '../../../../modules/session/history';
import { useAppTheme } from '../../../theme/useAppTheme';
import Icon from '../../icons/Icon';
import {
  formatHistorySoc,
  formatHistoryTime24,
  getHistoryCardMeta,
} from './historyFormat';

export interface HistoryCardProps {
  item: SessionHistoryItem;
  /** Separador superior entre sesiones del mismo día (color banda SectionLabel). */
  showDaySeparator?: boolean;
  onPayPress?: (sessionId: string) => void;
}

function isHistoryPaymentDue(item: SessionHistoryItem): boolean {
  if (item.paymentDue === true) return true;
  if (item.paymentDue === false) return false;
  const st = item.payment?.status;
  if (!st) return true;
  return st === 'PENDING' || st === 'FAILED';
}

export function HistoryCard({
  item,
  showDaySeparator = false,
  onPayPress,
}: HistoryCardProps) {
  const colors = useAppTheme();
  const meta = getHistoryCardMeta(item);
  const stationName =
    item.station?.name ??
    (item.station ? 'Estación sin nombre' : 'Estación desconocida');

  return (
    <View
      style={[
        styles.card,
        showDaySeparator && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.backgroundTertiary,
        },
      ]}
    >
      <View style={styles.row}>
        <Text
          category="s1"
          numberOfLines={2}
          style={[styles.stationName, { color: colors.text, flex: 1 }]}
        >
          {stationName}
        </Text>
        <View style={styles.rightColumn}>
          <View style={styles.timeRow}>
            <Text category="c1" style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatHistoryTime24(item.startedAt)}
            </Text>
            <Text category="c1" style={[styles.timeSep, { color: colors.textDisabled }]}>
              ·
            </Text>
            <Text category="c1" style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatHistoryTime24(item.endedAt)}
            </Text>
          </View>
          <Text category="c1" style={[styles.duration, { color: colors.textSecondary }]}>
            {meta.duration}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.batteryRow}>
          <View style={styles.batterySegment}>
            <Icon name="battery-quarter" size={16} color={colors.textSecondary} iconStyle="solid" />
            <Text category="c1" style={[styles.socText, { color: colors.text }]}>
              {formatHistorySoc(meta.initialSoc)}
            </Text>
          </View>
          <View style={styles.ellipsis}>
            <Icon name="circle" size={4} color={colors.textDisabled} iconStyle="solid" />
            <Icon name="circle" size={4} color={colors.textDisabled} iconStyle="solid" />
            <Icon name="circle" size={4} color={colors.textDisabled} iconStyle="solid" />
          </View>
          <View style={styles.batterySegment}>
            <Icon name="battery-full" size={16} color={colors.primary} iconStyle="solid" />
            <Text category="c1" style={[styles.socText, { color: colors.text }]}>
              {formatHistorySoc(meta.finalSoc)}
            </Text>
          </View>
        </View>
        <View style={styles.priceColumn}>
          <Text category="s2" style={[styles.price, { color: colors.text }]}>
            {meta.priceLabel}
          </Text>
          {isHistoryPaymentDue(item) && onPayPress ? (
            <Pressable
              onPress={() => onPayPress(item.id)}
              style={({ pressed }) => [
                styles.payButton,
                {
                  borderColor: colors.primary,
                  backgroundColor: pressed
                    ? colors.isDark
                      ? 'rgba(68, 183, 120, 0.15)'
                      : 'rgba(68, 183, 120, 0.12)'
                    : 'transparent',
                },
              ]}
            >
              <Text category="c1" style={{ color: colors.primary, fontWeight: '700' }}>
                Pagar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stationName: {
    fontWeight: '600',
    fontSize: 15,
  },
  rightColumn: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeSep: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  duration: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginTop: 10,
  },
  batterySegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ellipsis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: 4,
  },
  socText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 32,
  },
  priceColumn: {
    marginTop: 10,
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
  },
  payButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
});
