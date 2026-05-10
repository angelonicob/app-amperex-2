import { Button, Layout, Text } from '@ui-kitten/components';
import type { AxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParams } from '../../routes/navigationParams';
import { checkSessionStatus, getActiveSession, stopSession } from '../../../modules/session/session';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import { useActiveSessionStore } from '../../../modules/session/store/useActiveSessionStore';
import { useSessionWebSocket } from '../../../shared/hooks/useSessionWebSocket';
import { ConfirmPopup } from '../../../shared/components/ui/popup/ConfirmPopup';
import { replaceToRoute } from '../../routes/navigationRef';
import { useAppTheme } from '../../../shared/theme/useAppTheme';

const SUCCESS_DOT_COLOR = '#00E096';

const ChargeProgressCard = ({
  percentage,
  power,
}: {
  percentage: number;
  power: number;
}) => {
  const colors = useAppTheme();
  const clamped = Math.max(0, Math.min(Number.isFinite(percentage) ? percentage : 0, 100));
  const progress = clamped / 100;

  return (
    <Layout style={styles.progressCard} level="2">
      <View style={styles.progressTrack}>
        <View style={styles.progressTrackBackground} />
        <View
          style={[
            styles.progressDot,
            {
              left: `${progress * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
      <View style={styles.progressTextRow}>
        <Text style={styles.progressPercentage}>{clamped.toFixed(0)}%</Text>
        <Text style={styles.progressPower}>
          {`${Number.isFinite(power) ? Number(power).toFixed(1) : '0.0'} kW`}
        </Text>
      </View>
    </Layout>
  );
};

export const SessionChargeScreen = () => {
  const [currentEnergy, setCurrentEnergy] = useState<number>(0);
  const [currentPercentage, setCurrentPercentage] = useState<number>(0);
  const [currentPower, setCurrentPower] = useState<number>(0);
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const { scanQrResponse, chargingData, isCharging, setChargingData, setIsCharging } =
    useSessionStore();

  const navigation = useNavigation<StackNavigationProp<RootStackParams>>();
  const { isConnected: isWsConnected, lastUpdate, error: wsError } =
    useSessionWebSocket(chargingData?.sessionId);
  const navigatedToPaymentRef = useRef<boolean>(false);
  const stoppingWatchdogStartedRef = useRef<boolean>(false);

  // Consumir session-update del WebSocket nativo /sessions y persistir en store
  useEffect(() => {
    if (!lastUpdate || lastUpdate.type !== 'session-update') return;

    const sessionData = {
      sessionId: lastUpdate.data.sessionId,
      status: lastUpdate.data.status as any,
      ocppTransactionId: lastUpdate.data.ocppTransactionId
        ? parseInt(lastUpdate.data.ocppTransactionId)
        : undefined,
      startedAt: lastUpdate.data.startedAt,
      meterStart: lastUpdate.data.meterStart,
      energyKwh: lastUpdate.data.energyKwh,
      powerKw: lastUpdate.data.powerKw,
      currentPercentage: lastUpdate.data.currentPercentage,
      currentCost: lastUpdate.data.currentCost,
      voltageV: lastUpdate.data.voltageV,
      currentA: lastUpdate.data.currentA,
      timestamp: lastUpdate.data.timestamp || lastUpdate.timestamp,
      finalEnergy: lastUpdate.data.finalEnergy,
      ...(lastUpdate.data.finalPercentage != null
        ? { finalPercentage: lastUpdate.data.finalPercentage }
        : {}),
      ...(lastUpdate.data.totalCost != null ? { totalCost: lastUpdate.data.totalCost } : {}),
      ...(lastUpdate.data.totalDurationSeconds != null
        ? { totalDurationSeconds: lastUpdate.data.totalDurationSeconds }
        : {}),
      ...(lastUpdate.data.currency ? { currency: lastUpdate.data.currency } : {}),
      ...(lastUpdate.data.pricePerKwh != null
        ? { priceClpPerKwh: lastUpdate.data.pricePerKwh }
        : {}),
      reason: lastUpdate.data.reason,
      finishedAt: lastUpdate.data.finishedAt,
      message: lastUpdate.data.message,
    };

    setChargingData(sessionData);

    if (sessionData.status === 'CHARGING') setIsCharging(true);
    if (sessionData.status === 'FINISHED' || sessionData.status === 'FAILED') {
      setIsCharging(false);
    }

    // Fallback local UI
    if (typeof sessionData.energyKwh === 'number') setCurrentEnergy(sessionData.energyKwh);
    if (typeof sessionData.currentPercentage === 'number')
      setCurrentPercentage(sessionData.currentPercentage);
    if (typeof sessionData.powerKw === 'number') setCurrentPower(sessionData.powerKw);
    if (typeof sessionData.currentCost === 'number') setCurrentCost(sessionData.currentCost);
  }, [lastUpdate, setChargingData, setIsCharging]);

  useEffect(() => {
    if (!wsError) return;
    const normalized = String(wsError || '');
    const isSessionNotFound =
      normalized.toLowerCase().includes('session not found') ||
      normalized.toLowerCase().includes('not authorized');

    if (isSessionNotFound) {
      void (async () => {
        try {
          const active = await getActiveSession();
          if (!active?.session) {
            useSessionStore.getState().clearSession();
            useActiveSessionStore.getState().clearActiveSession();
            replaceToRoute('App');
            return;
          }
        } catch {
          // Si falla la revalidación, mantener el error visible.
        }
        Alert.alert('Error de conexión', wsError);
      })();
      return;
    }

    Alert.alert('Error de conexión', wsError);
  }, [wsError]);

  const clearActiveSession = useActiveSessionStore(s => s.clearActiveSession);

  // Cuando finaliza la carga, redirigir a Pago y limpiar store de sesión activa (persistido)
  useEffect(() => {
    if (chargingData?.status !== 'FINISHED') return;
    if (navigatedToPaymentRef.current) return;
    navigatedToPaymentRef.current = true;
    clearActiveSession();
    navigation.navigate('Session', { screen: 'Pago' });
  }, [chargingData?.status, clearActiveSession]);

  // Watchdog: si la sesión queda en STOPPING (especialmente tras restauración),
  // hacer polling para confirmar término y navegar a Pago aunque se pierda el WS.
  useEffect(() => {
    if (chargingData?.status !== 'STOPPING') {
      stoppingWatchdogStartedRef.current = false;
      return;
    }
    if (stoppingWatchdogStartedRef.current) return;
    stoppingWatchdogStartedRef.current = true;

    let cancelled = false;
    const run = async () => {
      const start = Date.now();
      const timeoutMs = 25_000;

      while (!cancelled && Date.now() - start < timeoutMs) {
        // Si llega FINISHED por WS, el effect de arriba navega.
        if (useSessionStore.getState().chargingData?.status === 'FINISHED') {
          return;
        }
        const active = await getActiveSession();
        if (!active.session) {
          setChargingData({ status: 'FINISHED' as any });
          return;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (!cancelled) {
        Alert.alert(
          'Está tardando',
          'La detención está demorando más de lo normal. Puedes reintentar detener la carga.',
        );
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [chargingData?.status, setChargingData]);

  const runStopCharging = async () => {
    console.log('[SessionCharge] runStopCharging: inicio');
    let sessionId = chargingData?.sessionId;
    console.log('[SessionCharge] runStopCharging: sessionId del store=', sessionId ?? 'null');
    if (!sessionId && scanQrResponse?.correlationId) {
      console.log(
        '[SessionCharge] runStopCharging: obteniendo sessionId por correlationId=',
        scanQrResponse.correlationId,
      );
      const statusRes = await checkSessionStatus(scanQrResponse.correlationId);
      console.log('[SessionCharge] runStopCharging: checkSessionStatus result=', statusRes?.sessionId ?? 'sin sessionId');
      if (statusRes?.sessionId) {
        sessionId = statusRes.sessionId;
      }
    }
    if (!sessionId) {
      console.log('[SessionCharge] runStopCharging: no hay sessionId, abortando');
      Alert.alert('Error', 'No hay sesión activa para detener. Espera a que la sesión esté en carga.');
      return;
    }
    setIsStopping(true);
    try {
      console.log('[SessionCharge] runStopCharging: llamando stopSession(', sessionId, ')');
      await stopSession(sessionId);
      console.log('[SessionCharge] runStopCharging: stopSession OK');

      // Fallback (importante tras restauración): si el WS no estaba unido al room a tiempo,
      // podemos no recibir `session-update` con FINISHED. En ese caso, poll a /session/active
      // hasta que el backend reporte que ya no hay sesión activa, y navegar a Pago.
      const start = Date.now();
      const timeoutMs = 20_000;
      let finished = false;
      while (!finished && Date.now() - start < timeoutMs) {
        // Si ya llegó FINISHED por WS, cortar.
        if (useSessionStore.getState().chargingData?.status === 'FINISHED') {
          finished = true;
          break;
        }
        const active = await getActiveSession();
        if (!active.session) {
          finished = true;
          // Marcar FINISHED local para que el effect de navegación se dispare.
          setChargingData({ status: 'FINISHED' as any });
          break;
        }
        // Esperar un poco antes del siguiente poll
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (!finished) {
        Alert.alert(
          'Detención enviada',
          'La carga se está deteniendo, pero está tardando en confirmar el cierre. Intenta nuevamente en unos segundos.',
        );
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string | string[] }>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message ?? axiosError.message ?? 'Error al detener la carga';
      const messageStr = Array.isArray(message) ? message[0] ?? message.join(', ') : message;
      console.log('[SessionCharge] runStopCharging: error', { status, message: messageStr, err });
      if (status === 401) {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
      } else if (status === 404) {
        Alert.alert('No se puede detener', messageStr);
      } else {
        Alert.alert('Error', messageStr);
      }
    } finally {
      setIsStopping(false);
      console.log('[SessionCharge] runStopCharging: fin');
    }
  };

  const handleStopCharging = () => {
    console.log('[SessionCharge] handleStopCharging: mostrando popup de confirmación');
    setShowStopConfirm(true);
  };

  const handleGoBack = () => {
    Alert.alert(
      'Salir',
      '¿Estás seguro de que deseas salir? La sesión se cerrará.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => {
            useSessionStore.getState().clearSession();
            useActiveSessionStore.getState().clearActiveSession();
            replaceToRoute('App');
          },
        },
      ],
    );
  };

  // Usar datos del WebSocket si existen
  const displayEnergy = chargingData?.energyKwh ?? currentEnergy;
  const displayPercentage = chargingData?.currentPercentage ?? currentPercentage;
  const displayPower = chargingData?.powerKw ?? currentPower;
  const displayCost = chargingData?.currentCost ?? currentCost;
  const displayTariffClpPerKwh = chargingData?.priceClpPerKwh;
  const displayStatus = chargingData?.status ?? (isCharging ? 'CHARGING' : 'CONNECTED');

  const canStop = isCharging || chargingData?.status === 'CHARGING';
  const isStoppingState = chargingData?.status === 'STOPPING';
  const showStopButton = canStop && !isStoppingState;

  // Al restaurar sesión tras reabrir la app, normalmente NO existe `scanQrResponse` (no hay QR escaneado).
  // La fuente de verdad para mostrar esta pantalla debe ser `chargingData.sessionId`.
  if (!chargingData?.sessionId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Layout style={styles.centeredBlock}>
          <Text category="s1" appearance="hint" style={styles.emptyText}>
            No hay sesión activa
          </Text>
          <Button status="primary" onPress={() => replaceToRoute('App')} style={styles.primaryButton}>
            Volver al inicio
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Layout style={styles.header}>
          <Text category="h5" style={styles.screenTitle}>
            Sesión de Carga
          </Text>
          <Text status="primary" category="s1" style={styles.inProgressText}>
            Carga en curso
          </Text>
        </Layout>

        <Layout style={styles.powerRow} level="2">
          <Layout style={styles.powerLeft} level="2">
            <Text style={styles.powerBig}>
              {Number.isFinite(displayPower) ? Number(displayPower).toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.powerUnit}>kW</Text>
          </Layout>
          <View style={styles.powerDivider} />
          <Layout style={styles.powerRight} level="2">
            <Text style={styles.costLabel}>Costo acumulado</Text>
            <Text style={styles.costValue}>
              {Math.round(Number(displayCost) || 0).toLocaleString('es-CL')} CLP
            </Text>
          </Layout>
        </Layout>

        {typeof displayTariffClpPerKwh === 'number' && (
          <Layout style={styles.card} level="2">
            <Text category="label" appearance="hint">
              Tarifa
            </Text>
            <Text category="s1">
              {Math.round(displayTariffClpPerKwh).toLocaleString('es-CL')} CLP/kWh
            </Text>
          </Layout>
        )}

        <ChargeProgressCard percentage={displayPercentage} power={displayPower} />

        <Layout style={styles.buttonContainer}>
          {isStoppingState && (
            <Layout style={styles.stoppingBadge} level="2">
              <Text status="warning" category="s1">
                Deteniendo carga...
              </Text>
            </Layout>
          )}
          {showStopButton && (
            <Button
              status="danger"
              onPress={handleStopCharging}
              disabled={isStopping}
              style={styles.dangerButton}
            >
              {isStopping ? 'Deteniendo carga...' : 'Detener Carga'}
            </Button>
          )}
        </Layout>
      </ScrollView>
      <ConfirmPopup
        visible={showStopConfirm}
        onRequestClose={() => {
          console.log('[SessionCharge] Usuario canceló detener');
          setShowStopConfirm(false);
        }}
        title="Detener Carga"
        labelCancel="Cancelar"
        labelConfirm="Detener"
        confirmDestructive
        onConfirm={() => {
          console.log('[SessionCharge] Usuario confirmó detener, ejecutando runStopCharging');
          setShowStopConfirm(false);
          void runStopCharging();
        }}
      >
        <Text>
          ¿Estás seguro de que deseas detener la carga?
        </Text>
      </ConfirmPopup>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centeredBlock: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 16, marginBottom: 24 },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  inProgressText: {
    fontStyle: 'italic',
    fontWeight: '700',
  },
  powerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  powerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  powerBig: {
    fontSize: 28,
    fontWeight: '700',
  },
  powerUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  powerDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#CBD639',
    marginHorizontal: 16,
  },
  powerRight: {
    flex: 1,
  },
  costLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stoppingBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  stoppingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 12, marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '600' },
  progressCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  progressTrackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E4E9F2',
    borderRadius: 4,
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressPower: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: { marginTop: 8 },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  dangerButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { fontWeight: '600', fontSize: 16 },
});
