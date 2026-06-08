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

export const CardConnector = ({ connector, chargePoint, onReserve, style }: CardConnectorProps) => {
  const colors = useAppTheme();

  // Inactivo: el conector no puede operar por configuración o por desconexión.
  // - chargePoint OFFLINE (sin señales OCPP recientes)
  // - operativeStatus distinto de ACTIVE (en chargePoint o conector): INACTIVE / MAINTENANCE / DISCONNECTED
  const isInactive =
    chargePoint.connectionState === 'OFFLINE' ||
    chargePoint.operativeStatus !== 'ACTIVE' ||
    connector.operativeStatus !== 'ACTIVE';
  const isOccupied =
    !isInactive && connector.status === ConnectorStatus.Occupied;
  const isUnavailable = isInactive || isOccupied;

  const cardBg = isUnavailable ? colors.backgroundTertiary : colors.background;
  const borderColor = isUnavailable ? colors.border : colors.primary;
  const contentColor = isUnavailable ? colors.textSecondary : colors.primary;

  const rawConnectorType = connector.connectorType ?? '';
  const connectorCode = rawConnectorType
    ? rawConnectorType.split('(')[0].trim()
    : '';
  const connectorName = connectorCode || `Conector ${connector.connectorId}`;
  const priceText =
    connector.price != null ? `${connector.price.toLocaleString('es-CL')} / kWh` : null;
  const powerText =
    connector.powerKw != null && connector.powerKw !== '' ? `${connector.powerKw} kW` : null;

  const statusLabel = isInactive ? 'Inactivo' : isOccupied ? 'Ocupado' : null;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }, style]}>
      <View style={styles.row1}>
        {statusLabel != null && (
          <Text style={[styles.statusLabel, { color: contentColor }]}>
            {statusLabel}
          </Text>
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
        onPress={isInactive ? undefined : onReserve}
        disabled={isInactive}
        style={[
          styles.reserveButton,
          {
            backgroundColor: isInactive ? colors.textDisabled : colors.primary,
            opacity: isInactive ? 0.6 : 1,
          },
        ]}
        android_ripple={
          isInactive ? undefined : { color: 'rgba(255,255,255,0.2)' }
        }
        accessibilityState={{ disabled: isInactive }}
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
  statusLabel: {
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
