import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import type { PaymentSummary } from '../../../modules/session/pendingPayment';

export interface SessionCompletionSummaryProps {
  summary: PaymentSummary;
  /** Si false, oculta fila de total en CLP (estación privada). */
  showAmount?: boolean;
}

export function SessionCompletionSummary({
  summary,
  showAmount = true,
}: SessionCompletionSummaryProps) {
  const colors = useAppTheme();
  const displayMinutes =
    summary.totalDurationSeconds != null
      ? Math.floor(summary.totalDurationSeconds / 60)
      : null;

  return (
    <Layout level="2" style={[styles.card, { borderColor: colors.border }]}>
      {showAmount && summary.requiresPayment !== false && (
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {Math.round(summary.amountClp).toLocaleString('es-CL')} {summary.currency}
          </Text>
        </View>
      )}
      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Energía</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {Number(summary.energyKwh || 0).toFixed(2)} kWh
        </Text>
      </View>
      <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Tarifa</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {summary.priceClpPerKwh != null
            ? `${Math.round(summary.priceClpPerKwh).toLocaleString('es-CL')} CLP/kWh`
            : '—'}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Duración</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {displayMinutes != null ? `${displayMinutes} min` : '—'}
        </Text>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: { fontSize: 14 },
  value: { fontSize: 15, fontWeight: '600' },
});
