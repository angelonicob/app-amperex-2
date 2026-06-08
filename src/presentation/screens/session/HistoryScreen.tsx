import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Text } from '@ui-kitten/components';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { EmptyStateLayout } from '../../../shared/components/layout/EmptyStateLayout';
import { buildHistoryListRows, HistoryCard } from '../../../shared/components/ui/card';
import { SectionLabel } from '../../../shared/components/ui/SectionLabel';
import {
  getSessionHistory,
  SessionHistoryItem,
} from '../../../modules/session/history';
import { navigateToSessionCompletion } from '../../../shared/utils/navigateToSessionCompletion';

export const HistoryScreen = () => {
  const colors = useAppTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SessionHistoryItem[]>([]);

  const listRows = useMemo(() => buildHistoryListRows(items), [items]);
  const showList = !loading && items.length > 0;

  const contentPadding = useMemo(
    () => ({
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: Math.max(insets.bottom, 16) + 24,
    }),
    [insets.bottom],
  );

  const handlePaySession = useCallback((sessionId: string) => {
    void navigateToSessionCompletion(sessionId);
  }, []);

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
    <Layout level="1" style={styles.flex1}>
      <FlatList
        style={styles.flex1}
        data={showList ? listRows : []}
        keyExtractor={(row) => row.id}
        contentContainerStyle={[styles.listContent, contentPadding]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text category="s1" appearance="hint" style={styles.loadingText}>
                Cargando historial...
              </Text>
            </View>
          ) : (
            <EmptyStateLayout
              title="Sin historial"
              subtitle="Aún no tienes sesiones registradas."
              icon={{ name: 'clock-rotate-left', iconStyle: 'solid' }}
            />
          )
        }
        renderItem={({ item: row, index }) =>
          row.type === 'date' ? (
                <SectionLabel label={row.label} />
          ) : (
            <HistoryCard
              item={row.item}
              showDaySeparator={
                index > 0 && listRows[index - 1]?.type === 'session'
              }
              onPayPress={handlePaySession}
            />
          )
        }
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingTop: 24,
    width: '100%',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
