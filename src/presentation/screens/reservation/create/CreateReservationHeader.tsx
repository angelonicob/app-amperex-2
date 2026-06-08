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
}

export function CreateReservationHeader({
  title,
  stationName,
  connectorLabel,
  subtitle,
}: CreateReservationHeaderProps) {
  const colors = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.closeColumn}>
          <Pressable
            onPress={exitCreateReservationFlow}
            style={[styles.iconButton, { backgroundColor: colors.backgroundTertiary }]}
            accessibilityLabel="Cancelar reserva"
            accessibilityRole="button"
          >
            <FontAwesome6 name="xmark" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.textColumn}>
          <Text category="h5" style={[styles.title, { color: colors.primary }]}>
            {title}
          </Text>

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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stationName: {
    fontSize: 14,
    lineHeight: 18,
    flexShrink: 1,
  },
  connectorLabel: {
    fontSize: 14,
    lineHeight: 18,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 16,
  },
});
