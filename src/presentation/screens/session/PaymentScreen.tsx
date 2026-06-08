import type { StackNavigationProp } from '@react-navigation/stack';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Layout } from '@ui-kitten/components';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  authorizePayment,
  getInscriptionStatus,
} from '../../../modules/session/oneclick';
import {
  getPaymentSummary,
  type PaymentSummary,
} from '../../../modules/session/pendingPayment';
import { usePendingPaymentStore } from '../../../modules/session/store/usePendingPaymentStore';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import type { SessionStackParams } from '../../routes/navigationParams';
import { replaceToRoute } from '../../routes/navigationRef';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useSystemChrome } from '../../../shared/hooks/useSystemChrome';
import { useInfoDialog } from '../../../shared/hooks/useInfoDialog';
import { requireBiometricForPayment } from '../../../shared/utils/biometricGuard';
import { runOneClickInscriptionFlow } from '../../../shared/utils/oneclickInscription';
import { SessionCompletionSummary } from '../../../shared/components/session/SessionCompletionSummary';
import { useNavigation } from '@react-navigation/native';

type Nav = StackNavigationProp<SessionStackParams, 'Pago'>;

function summaryFromChargingData(
  chargingData: ReturnType<typeof useSessionStore.getState>['chargingData'],
): PaymentSummary | null {
  if (!chargingData?.sessionId) return null;
  const totalCost =
    chargingData.totalCost ??
    chargingData.estimatedCostClp ??
    chargingData.currentCost ??
    0;
  const energyKwh =
    chargingData.finalEnergy ??
    chargingData.energyKwh ??
    chargingData.estimatedEnergyKwh ??
    0;
  const amountClp = Math.round(Number(totalCost) || 0);
  const paymentRequired =
    chargingData.paymentRequired === true ||
    (chargingData.paymentRequired !== false && amountClp > 0);
  return {
    sessionId: chargingData.sessionId,
    amountClp,
    currency: chargingData.currency ?? 'CLP',
    energyKwh: Number(energyKwh) || 0,
    priceClpPerKwh: chargingData.priceClpPerKwh ?? null,
    totalDurationSeconds:
      chargingData.totalDurationSeconds ??
      chargingData.estimatedDurationSeconds ??
      null,
    stationName: null,
    paymentStatus: paymentRequired ? 'PENDING' : 'CONFIRMED',
    requiresPayment: paymentRequired,
  };
}

export const PaymentScreen = () => {
  const navigation = useNavigation<Nav>();
  const colors = useAppTheme();
  const screenBackground = useSystemChrome();
  const [isProcessing, setIsProcessing] = useState(false);
  const [oneClickEnrolled, setOneClickEnrolled] = useState(false);
  const [oneClickCardLast4, setOneClickCardLast4] = useState<string | null>(null);
  const [oneClickCardType, setOneClickCardType] = useState<string | null>(null);
  const [loadingInscription, setLoadingInscription] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pendingContext = usePendingPaymentStore((s) => s.context);
  const setPendingContext = usePendingPaymentStore((s) => s.setContext);
  const clearPendingContext = usePendingPaymentStore((s) => s.clearContext);
  const chargingData = useSessionStore((s) => s.chargingData);
  const { showInfo, InfoDialog } = useInfoDialog();

  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      setLoadingSummary(true);
      setLoadError(null);
      try {
        if (pendingContext) {
          if (!cancelled) {
            setSummary(pendingContext);
            if (pendingContext.requiresPayment === false) {
              navigation.replace('Resumen');
            }
          }
          return;
        }
        const fromCharge = summaryFromChargingData(chargingData);
        if (fromCharge) {
          if (!cancelled) {
            setSummary(fromCharge);
            setPendingContext(fromCharge);
            if (fromCharge.requiresPayment === false) {
              navigation.replace('Resumen');
            }
          }
          return;
        }
        setLoadError('Información de pago no disponible');
      } catch {
        if (!cancelled) {
          setLoadError('No se pudo cargar el resumen de pago');
        }
      } finally {
        if (!cancelled) setLoadingSummary(false);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [pendingContext, chargingData, setPendingContext, navigation]);

  const refreshInscriptionStatus = useCallback(async () => {
    setLoadingInscription(true);
    try {
      const status = await getInscriptionStatus();
      setOneClickEnrolled(status.enrolled);
      setOneClickCardLast4(status.cardLast4 ?? null);
      setOneClickCardType(status.cardType ?? null);
    } catch {
      setOneClickEnrolled(false);
      setOneClickCardLast4(null);
      setOneClickCardType(null);
    } finally {
      setLoadingInscription(false);
    }
  }, []);

  useEffect(() => {
    refreshInscriptionStatus();
  }, [refreshInscriptionStatus]);

  const handlePayWithOneClick = async () => {
    // Fix #1.3 (UI): cortar reentradas antes de que React re-renderice y
    // aplique `disabled` al Pressable. Sin esta guarda, un doble-tap rápido
    // dispara dos requests `POST /authorize` antes del primer setState.
    if (isProcessing) return;
    if (!summary?.sessionId) {
      showInfo('Error', 'Información de pago no disponible');
      return;
    }
    setIsProcessing(true);
    try {
      // Fix #3.1: confirmación biométrica (con PIN del dispositivo como
      // fallback) antes de invocar el cobro. Solo bloqueamos si el
      // usuario cancela: si no hay hardware/enrolamiento, dejamos pasar
      // porque la sesión Firebase ya autentica al usuario.
      const formattedAmount = Math.round(
        Number(summary.amountClp) || 0,
      ).toLocaleString('es-CL');
      const auth = await requireBiometricForPayment(
        `Confirma el pago de ${formattedAmount} ${summary.currency} con One Click`,
      );
      if (!auth.ok) {
        if (auth.reason === 'cancelled') {
          // cancelación explícita del usuario; no mostramos alerta intrusiva
          return;
        }
        showInfo(
          'No se pudo verificar tu identidad',
          'No fue posible confirmar el pago con la huella/PIN del dispositivo. Intenta nuevamente.',
        );
        return;
      }

      await authorizePayment(summary.sessionId);
      showInfo('Éxito', 'Pago con One Click realizado correctamente.', {
        buttonTitle: 'OK',
        onAfterAccept: () => {
          useSessionStore.getState().clearSession();
          clearPendingContext();
          replaceToRoute('App');
        },
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      showInfo(
        'Error',
        message ?? 'No se pudo procesar el pago con One Click. Intenta de nuevo.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * #2.6: inscripción en sesión aislada vía WebBrowser. El resultado vuelve
   * por promesa, sin listeners ni race conditions con el deep link.
   */
  const handleStartInscription = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const outcome = await runOneClickInscriptionFlow();
      switch (outcome.kind) {
        case 'success':
          await refreshInscriptionStatus();
          return;
        case 'failed': {
          const { code } = outcome;
          showInfo(
            'No se pudo inscribir la tarjeta',
            code
              ? `La inscripción fue rechazada (código ${code}). Intenta nuevamente o usa otra tarjeta.`
              : 'La inscripción fue rechazada. Intenta nuevamente o usa otra tarjeta.',
          );
          await refreshInscriptionStatus();
          return;
        }
        case 'cancelled':
          return;
        case 'unknown':
        default:
          showInfo(
            'Error',
            'No se pudo confirmar el resultado de la inscripción. Verifica si tu tarjeta quedó registrada y, si no, inténtalo nuevamente.',
          );
          await refreshInscriptionStatus();
          return;
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      showInfo(
        'Error',
        message ?? 'No se pudo iniciar la inscripción. Intenta de nuevo.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryLoad = async () => {
    const sessionId =
      pendingContext?.sessionId ?? chargingData?.sessionId ?? null;
    if (!sessionId) {
      setLoadError('Información de pago no disponible');
      return;
    }
    setLoadingSummary(true);
    setLoadError(null);
    try {
      const loaded = await getPaymentSummary(sessionId);
      if (loaded.requiresPayment === false) {
        setPendingContext(loaded);
        navigation.replace('Resumen');
        return;
      }
      setSummary(loaded);
      setPendingContext(loaded);
    } catch {
      setLoadError('No se pudo cargar el resumen de pago');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loadingSummary) {
    return (
      <Fragment>
        <SafeAreaView
          style={[styles.flex1, { backgroundColor: screenBackground }]}
          edges={['top', 'bottom']}
        >
          <Layout level="1" style={styles.centeredBlock}>
            <ActivityIndicator size="large" color={colors.primary} />
          </Layout>
        </SafeAreaView>
        {InfoDialog}
      </Fragment>
    );
  }

  if (!summary || loadError) {
    return (
      <Fragment>
        <SafeAreaView
          style={[styles.flex1, { backgroundColor: screenBackground }]}
          edges={['top', 'bottom']}
        >
          <Layout level="1" style={styles.flex1}>
            <View style={styles.centeredBlock}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {loadError ?? 'Información de pago no disponible'}
              </Text>
              <Pressable
                onPress={() => void handleRetryLoad()}
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryButtonText}>Reintentar</Text>
              </Pressable>
              <Pressable
                onPress={() => replaceToRoute('App')}
                style={[styles.secondaryOutline, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary }}>Ir al inicio</Text>
              </Pressable>
            </View>
          </Layout>
        </SafeAreaView>
        {InfoDialog}
      </Fragment>
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
              Información de Pago
            </Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              {summary.stationName
                ? `${summary.stationName} · Revisa el resumen antes de pagar`
                : 'Revisa el resumen antes de pagar'}
            </Text>

            <SessionCompletionSummary summary={summary} showAmount />

            {!loadingInscription && (
              <>
                {oneClickEnrolled ? (
                  <>
                    {oneClickCardLast4 != null && (
                      <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
                        Tarjeta ****{oneClickCardLast4}
                        {oneClickCardType != null ? ` (${oneClickCardType})` : ''}
                      </Text>
                    )}
                    <Pressable
                      onPress={handlePayWithOneClick}
                      disabled={isProcessing}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        {
                          backgroundColor: colors.primary,
                          opacity: isProcessing || pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Text style={styles.primaryButtonText}>
                        {isProcessing ? 'Procesando...' : 'Pagar con One Click'}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={handleStartInscription}
                    disabled={isProcessing}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor: colors.primary,
                        opacity: isProcessing || pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isProcessing ? 'Procesando...' : 'Inscribir tarjeta One Click'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>
        </Layout>
      </SafeAreaView>
      {InfoDialog}
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
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: { fontSize: 14 },
  value: { fontSize: 15, fontWeight: '600' },
  cardHint: { fontSize: 13, marginBottom: 8 },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  secondaryOutline: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
