import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';
import { FontAwesome6 } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/useAppTheme';

export interface ConnectorInfoProps {
  connectorType?: string;
  price?: string;
  powerKw?: string;
}

export const ConnectorInfo = ({
  connectorType,
  price,
  powerKw,
}: ConnectorInfoProps) => {
  const colors = useAppTheme();
  const primary = colors.primary;

  return (
    <Layout style={styles.container} level="1">
      <Layout style={styles.leftColumn} level="1">
        <FontAwesome6 name="charging-station" size={32} color={primary} />
      </Layout>
      <Layout style={styles.iconRight} level="1">
        {connectorType ? (
          <Text category="s1" style={[styles.connectorType, { color: primary }]}>
            {connectorType}
          </Text>
        ) : null}
        {(price != null || powerKw != null) ? (
          <Layout style={styles.row} level="1">
            {price != null && (
              <Layout style={styles.chip} >
                <FontAwesome6
                  name="dollar-sign"
                  size={14}
                  color={primary}
                  style={styles.icon}
                />
                <Text category="p2" style={{ color: primary }}>{price}</Text>
              </Layout>
            )}
            {powerKw != null && (
              <Layout style={styles.chip} >
                <FontAwesome6
                  name="bolt"
                  size={14}
                  color={primary}
                  style={styles.icon}
                />
                <Text category="p2" style={{ color: primary }}>{powerKw}</Text>
              </Layout>
            )}
          </Layout>
        ) : null}
        {!connectorType && price == null && powerKw == null ? (
          <Text category="p2" style={{ color: colors.textSecondary }}>—</Text>
        ) : null}
      </Layout>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  leftColumn: {
    marginRight: 12,
  },
  connectorType: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    marginRight: 8,
  },
  iconRight: {
    flex: 1,
  },
});
