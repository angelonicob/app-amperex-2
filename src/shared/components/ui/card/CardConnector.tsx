import { StyleSheet, View, Pressable, ViewStyle } from 'react-native';
import { Text } from '@ui-kitten/components';
import Icon from '../../icons/Icon';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { ChargePoint, Connector } from '../../../../modules/station/types/station';
import { ConnectorStatus } from '../../../../modules/station/types/connector.status';

export interface CardConnectorProps {
  connector: Connector;
  chargePoint: ChargePoint;
  onReserve: () => void;
  style?: ViewStyle;
}

const OCCUPIED_BG = '#E5E7EB';
const OCCUPIED_TEXT = '#4B5563';

export const CardConnector = ({ connector, chargePoint, onReserve, style }: CardConnectorProps) => {
  const colors = useAppTheme();
  const isOccupied = connector.status === ConnectorStatus.Occupied;

  const cardBg = isOccupied ? OCCUPIED_BG : colors.background;
  const borderColor = isOccupied ? OCCUPIED_BG : colors.primary;
  const contentColor = isOccupied ? OCCUPIED_TEXT : colors.primary;

  const rawConnectorType = connector.connectorType ?? '';
  const connectorCode = rawConnectorType
    ? rawConnectorType.split('(')[0].trim()
    : '';
  const connectorName = connectorCode || `Conector ${connector.connectorId}`;
  const priceText =
    connector.price != null ? `${connector.price.toLocaleString('es-CL')} / kWh` : null;
  const powerText =
    connector.powerKw != null && connector.powerKw !== '' ? `${connector.powerKw} kW` : null;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }, style]}>
      <View style={styles.row1}>
        {isOccupied && (
          <Text style={[styles.occupiedLabel, { color: OCCUPIED_TEXT }]}>Ocupado</Text>
        )}
        <Text
          style={[styles.connectorName, { color: contentColor }]}
          numberOfLines={1}
        >
          {connectorName}
        </Text>
      </View>
      <View style={styles.row2}>
        {priceText != null && (
          <View style={styles.metaItem}>
            <Icon name="dollar-sign" size={12} color={contentColor} iconStyle="solid" />
            <Text style={[styles.metaText, { color: contentColor }]} numberOfLines={1}>
              {priceText}
            </Text>
          </View>
        )}
        {powerText != null && (
          <View style={styles.metaItem}>
            <Icon name="bolt" size={12} color={contentColor} iconStyle="solid" />
            <Text style={[styles.metaText, { color: contentColor }]} numberOfLines={1}>
              {powerText}
            </Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={onReserve}
        style={[styles.reserveButton, { backgroundColor: colors.primary }]}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <Text style={[styles.reserveButtonText, { color: colors.background }]}>Reservar</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  occupiedLabel: {
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  connectorName: {
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  row2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    maxWidth: 100,
  },
  reserveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reserveButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
});
