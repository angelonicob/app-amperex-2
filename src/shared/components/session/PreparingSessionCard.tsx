import { StyleSheet, View } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';
import type { Car } from '../../../modules/user/types/car';
import CarHorizontalIcon from '../../../../assets/images/icons/car-horizontal.svg';

export interface PreparingSessionCardProps {
  vehicle: Car;
  chargePointName: string;
  connectorName: string;
  priceText?: string;
}

export const PreparingSessionCard = ({
  vehicle,
  chargePointName,
  connectorName,
  priceText,
}: PreparingSessionCardProps) => {
  const colors = useAppTheme();

  return (
    <Layout style={styles.container}>
      <View style={styles.image}>
        <CarHorizontalIcon width={88} height={60} />
      </View>
      <Layout style={styles.leftColumn}>
        <Text category="s1" style={[styles.carName, { color: colors.text }]}>
          {vehicle.brand} {vehicle.model}
        </Text>
        <Text
          category="p2"
          style={[styles.connectorLine, { color: colors.primary }]}
        >
          {chargePointName} – {connectorName}
        </Text>
        {priceText != null ? (
          <Text category="p2" style={[styles.price, { color: colors.textSecondary }]}>
            {priceText}
          </Text>
        ) : null}
      </Layout>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  leftColumn: {
    flex: 1,
    marginLeft: 16,
  },
  carName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  connectorLine: {
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
  },
  image: {
    width: 88,
    height: 60,
    marginRight: -8,
  },
});
