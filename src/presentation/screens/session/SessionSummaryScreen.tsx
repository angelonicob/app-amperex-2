import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Layout } from '@ui-kitten/components';
import {
  getPaymentSummary,
  type PaymentSummary,
} from '../../../modules/session/pendingPayment';
import { usePendingPaymentStore } from '../../../modules/session/store/usePendingPaymentStore';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import { SessionCompletionSummary } from '../../../shared/components/session/SessionCompletionSummary';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useSystemChrome } from '../../../shared/hooks/useSystemChrome';
import { replaceToRoute } from '../../routes/navigationRef';
import { buildSessionCompletionSubtitle } from '../../../shared/utils/sessionCompletionSubtitle';

function summaryFromChargingData(
  chargingData: ReturnType<typeof useSessionStore.getState>['chargingData'],
): PaymentSummary | null {
  if (!chargingData?.sessionId) return null;
  const energyKwh =
    chargingData.finalEnergy ??
    chargingData.energyKwh ??
    chargingData.estimatedEnergyKwh ??
    0;
  return {
    sessionId: chargingData.sessionId,
    amountClp: 0,
    currency: chargingData.currency ?? 'CLP',
    energyKwh: Number(energyKwh) || 0,
    priceClpPerKwh: chargingData.priceClpPerKwh ?? null,
    totalDurationSeconds:
      chargingData.totalDurationSeconds ??
      chargingData.estimatedDurationSeconds ??
      null,
    stationName: null,
    paymentStatus: 'CONFIRMED',
    requiresPayment: false,
  };
}

export const SessionSummaryScreen = () => {
  const colors = useAppTheme();
  const screenBackground = useSystemChrome();
  const pendingContext = usePendingPaymentStore(s => s.context);
  const setPendingContext = usePendingPaymentStore(s => s.setContext);
  const clearPendingContext = usePendingPaymentStore(s => s.clearContext);
  const chargingData = useSessionStore(s => s.chargingData);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      setLoadingSummary(true);
      setLoadError(null);
      try {
        if (pendingContext?.requiresPayment === false) {
          if (!cancelled) setSummary(pendingContext);
          return;
        }
        const fromCharge = summaryFromChargingData(chargingData);
        if (
          fromCharge &&
          (chargingData?.paymentRequired === false ||
            pendingContext?.requiresPayment === false)
        ) {
          if (!cancelled) {
            setSummary(fromCharge);
            setPendingContext(fromCharge);
          }
          return;
        }
        const sessionId =
          pendingContext?.sessionId ?? chargingData?.sessionId ?? null;
        if (!sessionId) {
          setLoadError('Información de la sesión no disponible');
          return;
        }
        const loaded = await getPaymentSummary(sessionId);
        if (loaded.requiresPayment !== false) {
          setLoadError('Esta sesión requiere pago');
          return;
        }
        if (!cancelled) {
          setSummary(loaded);
          setPendingContext(loaded);
        }
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el resumen de la carga');
        }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [pendingContext, chargingData, setPendingContext]);

  const subtitle = useMemo(() => {
    if (!summary) return '';
    return buildSessionCompletionSubtitle(summary);
  }, [summary]);

  const handleDone = () => {
    useSessionStore.getState().clearSession();
    clearPendingContext();
    replaceToRoute('App');
  };

  if (loadingSummary) {
    return (
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top', 'bottom']}
      >
        <Layout level="1" style={styles.centeredBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Layout>
      </SafeAreaView>
    );
  }

  if (!summary || loadError) {
    return (
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top', 'bottom']}
      >
        <Layout level="1" style={styles.flex1}>
          <View style={styles.centeredBlock}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {loadError ?? 'Información no disponible'}
            </Text>
            <Pressable
              onPress={handleDone}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryButtonText}>Ir al inicio</Text>
            </Pressable>
          </View>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <Fragment>
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top', 'bottom']}
      >
        <Layout level="1" style={styles.flex1}>
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Carga finalizada
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
            <SessionCompletionSummary summary={summary} showAmount={false} />
            <Pressable
              onPress={handleDone}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryButtonText}>Ir al inicio</Text>
            </Pressable>
          </ScrollView>
        </Layout>
      </SafeAreaView>
    </Fragment>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centeredBlock: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  emptyText: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
