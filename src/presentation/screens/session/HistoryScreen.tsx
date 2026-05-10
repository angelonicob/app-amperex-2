import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import {
  getSessionHistory,
  SessionHistoryItem,
} from '../../../modules/session/history';

const formatDateTime = (iso: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
};

const formatEnergy = (energyKwh?: string | null) => {
  if (!energyKwh) return '-';
  const n = Number(energyKwh);
  if (Number.isNaN(n)) return '-';
  return `${n.toFixed(2)} kWh`;
};

const mapStatusLabel = (status: string) => {
  const u = status.toUpperCase();
  if (u === 'FINISHED') return 'Completada';
  if (u === 'FAILED') return 'Fallida';
  return status;
};

export const HistoryScreen = () => {
  const colors = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SessionHistoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getSessionHistory();
        if (!cancelled) {
          setItems(data ?? []);
        }
      } catch (error) {
        console.error('Error loading session history:', error);
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Historial de sesiones
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sesiones completadas y fallidas recientes
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Cargando historial...
          </Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aún no tienes sesiones registradas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const stationName =
              item.station?.name ??
              (item.station ? 'Estación sin nombre' : 'Estación desconocida');
            const statusLabel = mapStatusLabel(item.status);
            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {stationName}
                </Text>
                <Text
                  style={[styles.cardStatus, { color: colors.textSecondary }]}
                >
                  Estado: {statusLabel}
                </Text>
                <View
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.label, { color: colors.textSecondary }]}
                  >
                    Inicio
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatDateTime(item.startedAt)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.row,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.label, { color: colors.textSecondary }]}
                  >
                    Fin
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatDateTime(item.endedAt)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text
                    style={[styles.label, { color: colors.textSecondary }]}
                  >
                    Energía
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatEnergy(item.energyKwh)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardStatus: {
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
});

