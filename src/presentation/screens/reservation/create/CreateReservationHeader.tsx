import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui-kitten/components';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import { exitCreateReservationFlow } from '../../../../modules/reservation/createReservationFlow';

export interface CreateReservationHeaderProps {
  title: string;
  stationName?: string;
  connectorLabel?: string;
  /** Texto secundario bajo estación y conector (p. ej. horario operativo). */
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function CreateReservationHeader({
  title,
  stationName,
  connectorLabel,
  subtitle,
  showBack = false,
  onBack,
}: CreateReservationHeaderProps) {
  const colors = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable
          onPress={exitCreateReservationFlow}
          style={[styles.iconButton, { backgroundColor: colors.backgroundTertiary }]}
          accessibilityLabel="Cancelar reserva"
          accessibilityRole="button"
        >
          <FontAwesome6 name="xmark" size={18} color={colors.text} />
        </Pressable>
        <Text category="h5" style={[styles.title, { color: colors.primary }]}>
          {title}
        </Text>
      </View>
      {stationName || connectorLabel ? (
        <View style={styles.stationRow}>
          {stationName ? (
            <Text
              category="s1"
              style={[styles.stationName, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {stationName}
            </Text>
          ) : null}
          {stationName && connectorLabel ? (
            <Text category="s1" style={{ color: colors.textSecondary }}>
              {' · '}
            </Text>
          ) : null}
          {connectorLabel ? (
            <Text
              category="s1"
              style={[styles.connectorLabel, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {connectorLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
      {subtitle ? (
        <Text
          category="c1"
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      ) : null}
      {showBack && onBack ? (
        <Pressable onPress={onBack} style={styles.backRow}>
          <FontAwesome6 name="chevron-left" size={14} color={colors.primary} />
          <Text category="s1" style={{ color: colors.primary, marginLeft: 6 }}>
            Volver
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: 48,
  },
  stationName: {
    fontSize: 14,
    flexShrink: 1,
  },
  connectorLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    marginLeft: 48,
    lineHeight: 18,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 48,
    marginTop: 4,
  },
});
