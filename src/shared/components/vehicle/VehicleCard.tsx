import { Card, Text, useTheme } from '@ui-kitten/components';
import { StyleSheet, View } from 'react-native';
import { Car } from '../../../modules/user/types/car';

interface VehicleCardProps {
  vehicle: Car;
}

export const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const theme = useTheme();
  return (
    <Card style={styles.card} status="basic">
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text category="s1" style={styles.brandText}>
            {vehicle.brand}
          </Text>
          <Text category="p2" appearance="hint">
            {vehicle.model}
          </Text>
        </View>
        {vehicle.plate && (
          <View style={[styles.plateBadge, { backgroundColor: theme['color-basic-transparent-200'] }]}>
            <Text category="c1" status="primary" style={styles.plateText}>
              {vehicle.plate}
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.separator, { backgroundColor: theme['border-basic-color-3'] }]} />
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text category="c1" appearance="hint" style={styles.detailLabel}>
            Versión
          </Text>
          <Text category="s2">{vehicle.variant.name}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text category="c1" appearance="hint" style={styles.detailLabel}>
            Año
          </Text>
          <Text category="s2">
            {vehicle.variant.yearFrom} - {vehicle.variant.yearTo}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  brandText: {
    fontWeight: '700',
    marginBottom: 4,
  },
  plateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: 'color-basic-transparent-200',
  },
  plateText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  separator: {
    height: 1,
    marginBottom: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
