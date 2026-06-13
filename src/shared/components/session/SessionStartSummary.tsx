import { StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import type { Car } from '../../../modules/user/types/car';
import CarHorizontalIcon from '../../../../assets/images/icons/car-horizontal.svg';

export interface SessionStartSummaryProps {
  stationName?: string;
  chargePointName: string;
  connectorName: string;
  departureLabel: string;
  vehicle: Car;
  chargeModeLabel: string;
  chargeTargetLabel: string;
  priceText?: string;
  estimateText?: string | null;
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const colors = useAppTheme();

  return (
    <View style={styles.row}>
      <Text category="c1" style={[styles.rowLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        category="s1"
        style={[
          styles.rowValue,
          { color: highlight ? colors.primary : colors.text },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export const SessionStartSummary = ({
  stationName,
  chargePointName,
  connectorName,
  departureLabel,
  vehicle,
  chargeModeLabel,
  chargeTargetLabel,
  priceText,
  estimateText,
}: SessionStartSummaryProps) => {
  const colors = useAppTheme();

  const yearLabel =
    vehicle.variant.yearTo !== vehicle.variant.yearFrom
      ? `${vehicle.variant.yearFrom}–${vehicle.variant.yearTo}`
      : String(vehicle.variant.yearFrom);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.backgroundTertiary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIcon}>
          <CarHorizontalIcon width={72} height={48} />
        </View>
        <View style={styles.vehicleText}>
          <Text category="s1" style={[styles.vehicleTitle, { color: colors.text }]}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text category="c1" style={{ color: colors.textSecondary }}>
            {vehicle.variant.name} · {yearLabel}
          </Text>
          <Text category="c1" style={{ color: colors.textSecondary }}>
            {vehicle.plate.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {stationName ? (
        <SummaryRow label="Estación" value={stationName} />
      ) : null}
      <SummaryRow
        label="Conector"
        value={`${chargePointName} · ${connectorName}`}
      />
      <SummaryRow label="Salida" value={departureLabel} highlight />
      <SummaryRow label="Modo de carga" value={chargeModeLabel} />
      <SummaryRow label="Objetivo" value={chargeTargetLabel} highlight />
      {priceText ? <SummaryRow label="Tarifa" value={priceText} /> : null}
      {estimateText ? (
        <Text category="c1" style={[styles.estimate, { color: colors.textSecondary }]}>
          {estimateText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIcon: {
    flexShrink: 0,
  },
  vehicleText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  vehicleTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowValue: {
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  estimate: {
    marginTop: 4,
    lineHeight: 18,
  },
});
