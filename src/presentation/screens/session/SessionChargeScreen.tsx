import { Button, Layout, Text, useTheme } from '@ui-kitten/components';
import type { AxiosError } from 'axios';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParams } from '../../routes/navigationParams';
import { checkSessionStatus, getActiveSession, stopSession } from '../../../modules/session/session';
import { useSessionStore } from '../../../modules/session/store/useSessionStore';
import { usePendingPaymentStore } from '../../../modules/session/store/usePendingPaymentStore';
import type { PaymentSummary } from '../../../modules/session/pendingPayment';
import { useActiveSessionStore } from '../../../modules/session/store/useActiveSessionStore';
import { useSessionWebSocket } from '../../../shared/hooks/useSessionWebSocket';
import { ConfirmPopup } from '../../../shared/components/ui/popup/ConfirmPopup';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useInfoDialog } from '../../../shared/hooks/useInfoDialog';
import { navigateToSessionCompletion } from '../../../shared/utils/navigateToSessionCompletion';
import { replaceToRoute } from '../../routes/navigationRef';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useSystemChrome } from '../../../shared/hooks/useSystemChrome';
import { formatElapsedSince } from '../../../shared/components/ui/card/historyFormat';

function wsMetricNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const CHARGE_MODE_LABELS: Record<string, string> = {
  TARGET: 'Por energía (kWh)',
  AMOUNT: 'Por monto (CLP)',
  FULL: 'Carga completa',
};

function formatDepartureTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Costo acumulado en CLP para la UI (incluye montos &lt; 1 con decimales). */
function formatAccumulatedCostClp(clp: number): string {
  if (!Number.isFinite(clp) || clp < 0) return '—';
  const int = Math.round(clp);
  if (Math.abs(clp - int) < 1e-6) {
    if (int === 0) return '0';
    return int.toLocaleString('es-CL');
  }
  if (clp < 1) return clp.toFixed(2);
  return clp.toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

const ChargeProgressCard = ({
  energyKwh,
  startedAt,
  /** 0–100: SOC del vehículo (fallback de la barra si no hay objetivo kWh). */
  socPercent,
  /** Si existe, la barra refleja energía entregada / objetivo estimado. */
  targetEnergyKwh,
}: {
  energyKwh: number;
  startedAt?: string | null;
  socPercent: number;
  targetEnergyKwh?: number | null;
}) => {
  const colors = useAppTheme();
  const theme = useTheme();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const energy = Number.isFinite(energyKwh) && energyKwh >= 0 ? energyKwh : 0;
  const target =
    typeof targetEnergyKwh === 'number' &&
    Number.isFinite(targetEnergyKwh) &&
    targetEnergyKwh > 0
      ? targetEnergyKwh
      : null;
  const barFromEnergy = target != null ? Math.min(100, (energy / target) * 100) : null;
  const barFromSoc = Math.max(
    0,
    Math.min(Number.isFinite(socPercent) ? socPercent : 0, 100),
  );
  const progress = (barFromEnergy != null ? barFromEnergy : barFromSoc) / 100;

  return (
    <Layout style={styles.progressCard} level="2">
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressTrackBackground,
            { backgroundColor: theme['background-basic-color-3'] },
          ]}
        />
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
        <Layout style={styles.progressMetricCol} level="2">
          <Text category="c1" appearance="hint" style={styles.costLabel}>
            Energía cargada
          </Text>
          <Text style={styles.costValue}>{energy.toFixed(2)} kWh</Text>
        </Layout>
        <Layout style={[styles.progressMetricCol, styles.progressMetricColRight]} level="2">
          <Text
            category="c1"
            appearance="hint"
            style={[styles.costLabel, styles.progressMetricLabelRight]}
          >
            Tiempo transcurrido
          </Text>
          <Text style={[styles.costValue, styles.progressMetricValueRight]}>
            {formatElapsedSince(startedAt, nowMs)}
          </Text>
        </Layout>
      </View>
    </Layout>
  );
};

export const SessionChargeScreen = () => {
  const colors = useAppTheme();
  const screenBackground = useSystemChrome();
  const [currentEnergy, setCurrentEnergy] = useState<number>(0);
  const [currentPercentage, setCurrentPercentage] = useState<number>(0);
  const [currentPower, setCurrentPower] = useState<number>(0);
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const { scanQrResponse, chargingData, isCharging, setChargingData, setIsCharging } =
    useSessionStore();
  const activePersisted = useActiveSessionStore(s => s.activeSession);
  const effectiveSessionId = chargingData?.sessionId ?? activePersisted?.id;

  const navigation = useNavigation<StackNavigationProp<RootStackParams>>();
  const {
    isConnected: isWsConnected,
    lastUpdate,
    updateSeq,
    error: wsError,
    reconnect,
  } = useSessionWebSocket(effectiveSessionId);

  // Si el store de carga aún no tiene sessionId (carrera tras cold start), hidratar desde sesión activa persistida + backend.
  useEffect(() => {
    if (chargingData?.sessionId) return;
    const sid = activePersisted?.id;
    if (!sid) return;
    const st = activePersisted.status;
    if (st !== 'CHARGING' && st !== 'STOPPING') return;
    setChargingData({
      sessionId: sid,
      status: st as 'CHARGING' | 'STOPPING',
      startedAt: activePersisted.startedAt ?? undefined,
    });
    setIsCharging(true);
  }, [
    activePersisted,
    chargingData?.sessionId,
    setChargingData,
    setIsCharging,
  ]);
  const navigatedToPaymentRef = useRef<boolean>(false);
  const stoppingWatchdogStartedRef = useRef<boolean>(false);
  const { showInfo, InfoDialog } = useInfoDialog();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  // Consumir session-update del WebSocket nativo /sessions y persistir en store
  useEffect(() => {
    if (!lastUpdate || lastUpdate.type !== 'session-update') return;

    const updateSessionId = lastUpdate.data.sessionId?.trim();
    if (
      updateSessionId &&
      effectiveSessionId &&
      updateSessionId !== effectiveSessionId.trim()
    ) {
      return;
    }

    const energyKwh = wsMetricNumber(lastUpdate.data.energyKwh);
    const powerKw = wsMetricNumber(lastUpdate.data.powerKw);
    const currentPercentage = wsMetricNumber(lastUpdate.data.currentPercentage);
    const currentCost = wsMetricNumber(lastUpdate.data.currentCost);
    const pricePerKwh = wsMetricNumber(lastUpdate.data.pricePerKwh);

    const sessionData = {
      sessionId: lastUpdate.data.sessionId,
      status: lastUpdate.data.status as any,
      ocppTransactionId: lastUpdate.data.ocppTransactionId
        ? parseInt(lastUpdate.data.ocppTransactionId, 10)
        : undefined,
      startedAt: lastUpdate.data.startedAt,
      meterStart: wsMetricNumber(lastUpdate.data.meterStart),
      ...(energyKwh !== undefined ? { energyKwh } : {}),
      ...(powerKw !== undefined ? { powerKw } : {}),
      ...(currentPercentage !== undefined ? { currentPercentage } : {}),
      ...(currentCost !== undefined ? { currentCost } : {}),
      voltageV: lastUpdate.data.voltageV,
      currentA: lastUpdate.data.currentA,
      timestamp: lastUpdate.data.timestamp || lastUpdate.timestamp,
      ...(wsMetricNumber(lastUpdate.data.finalEnergy) !== undefined
        ? { finalEnergy: wsMetricNumber(lastUpdate.data.finalEnergy) }
        : {}),
      ...(lastUpdate.data.finalPercentage != null
        ? { finalPercentage: lastUpdate.data.finalPercentage }
        : {}),
      ...(lastUpdate.data.totalCost != null ? { totalCost: lastUpdate.data.totalCost } : {}),
      ...(lastUpdate.data.totalDurationSeconds != null
        ? { totalDurationSeconds: lastUpdate.data.totalDurationSeconds }
        : {}),
      ...(lastUpdate.data.currency ? { currency: lastUpdate.data.currency } : {}),
      ...(pricePerKwh !== undefined ? { priceClpPerKwh: pricePerKwh } : {}),
      reason: lastUpdate.data.reason,
      finishedAt: lastUpdate.data.finishedAt,
      message: lastUpdate.data.message,
      ...(typeof lastUpdate.data.paymentRequired === 'boolean'
        ? { paymentRequired: lastUpdate.data.paymentRequired }
        : {}),
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
  }, [
    lastUpdate,
    updateSeq,
    effectiveSessionId,
    setChargingData,
    setIsCharging,
  ]);

  // Solo errores fatales del WS (sesión inexistente / no autorizada). Los cortes
  // transitorios al ir a background se muestran en el banner, no en un modal.
  useEffect(() => {
    if (!wsError) return;
    const normalized = String(wsError).toLowerCase();
    const isSessionNotFound =
      normalized.includes('session not found') ||
      normalized.includes('not authorized');
    if (!isSessionNotFound) return;

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
        // Si falla la revalidación, el banner sigue mostrando el error.
      }
      showInfo('Sesión no disponible', wsError);
    })();
  }, [wsError, showInfo]);

  const clearActiveSession = useActiveSessionStore(s => s.clearActiveSession);

  // Cuando finaliza la carga, redirigir a resumen o pago según estación
  useEffect(() => {
    if (chargingData?.status !== 'FINISHED') return;
    if (navigatedToPaymentRef.current) return;
    navigatedToPaymentRef.current = true;
    const data = chargingData;
    clearActiveSession();

    if (!data?.sessionId) {
      replaceToRoute('App');
      return;
    }

    const totalCost =
      data.totalCost ?? data.estimatedCostClp ?? data.currentCost ?? 0;
    const energyKwh =
      data.finalEnergy ?? data.energyKwh ?? data.estimatedEnergyKwh ?? 0;
    const amountClp = Math.round(Number(totalCost) || 0);
    const paymentRequired =
      data.paymentRequired === true ||
      (data.paymentRequired !== false && amountClp > 0);

    const summary: PaymentSummary = {
      sessionId: data.sessionId,
      amountClp,
      currency: data.currency ?? 'CLP',
      energyKwh: Number(energyKwh) || 0,
      priceClpPerKwh: data.priceClpPerKwh ?? null,
      totalDurationSeconds:
        data.totalDurationSeconds ?? data.estimatedDurationSeconds ?? null,
      stationName: null,
      paymentStatus: paymentRequired ? 'PENDING' : 'CONFIRMED',
      requiresPayment: paymentRequired,
    };
    usePendingPaymentStore.getState().setContext(summary);

    void navigateToSessionCompletion(data.sessionId, summary).catch(() => {
      if (paymentRequired) {
        navigation.navigate('Session', { screen: 'Pago' });
      } else {
        navigation.navigate('Session', { screen: 'Resumen' });
      }
    });
  }, [chargingData, clearActiveSession, navigation]);

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
        showInfo(
          'Está tardando',
          'La detención está demorando más de lo normal. Puedes reintentar detener la carga.',
        );
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [chargingData?.status, setChargingData, showInfo]);

  const runStopCharging = async () => {
    console.log('[SessionCharge] runStopCharging: inicio');
    let sessionId = chargingData?.sessionId ?? activePersisted?.id;
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
      showInfo('Error', 'No hay sesión activa para detener. Espera a que la sesión esté en carga.');
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
        showInfo(
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
        showInfo('Sesión expirada', 'Inicia sesión de nuevo.');
      } else if (status === 404) {
        showInfo('No se puede detener', messageStr);
      } else {
        showInfo('Error', messageStr);
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
    showConfirm({
      title: 'Salir',
      message: '¿Estás seguro de que deseas salir? La sesión se cerrará.',
      labelCancel: 'Cancelar',
      labelConfirm: 'Salir',
      confirmDestructive: true,
      onConfirm: () => {
        useSessionStore.getState().clearSession();
        useActiveSessionStore.getState().clearActiveSession();
        replaceToRoute('App');
      },
    });
  };

  // Usar datos del WebSocket si existen; si falta currentCost, derivar energía × tarifa.
  const displayEnergy = chargingData?.energyKwh ?? currentEnergy;
  const displayPercentage = chargingData?.currentPercentage ?? currentPercentage;
  const displayPower = chargingData?.powerKw ?? currentPower;
  const displayTariffClpPerKwh = chargingData?.priceClpPerKwh;
  const displayCostClp = useMemo(() => {
    const e = chargingData?.energyKwh ?? currentEnergy;
    const p = chargingData?.priceClpPerKwh;
    const derived =
      typeof e === 'number' &&
      typeof p === 'number' &&
      Number.isFinite(e) &&
      Number.isFinite(p) &&
      e >= 0 &&
      p > 0
        ? Math.round(e * p)
        : null;
    const fromServer = chargingData?.currentCost ?? currentCost;
    if (typeof fromServer === 'number' && Number.isFinite(fromServer)) {
      if (fromServer > 0 || derived == null || derived <= 0) return fromServer;
      return derived;
    }
    return derived ?? 0;
  }, [
    chargingData?.currentCost,
    chargingData?.energyKwh,
    chargingData?.priceClpPerKwh,
    currentCost,
    currentEnergy,
  ]);
  const displayStatus = chargingData?.status ?? (isCharging ? 'CHARGING' : 'CONNECTED');
  const sessionStartedAt = chargingData?.startedAt ?? activePersisted?.startedAt;
  const chargeModeLabel = chargingData?.mode
    ? CHARGE_MODE_LABELS[chargingData.mode] ?? chargingData.mode
    : null;
  const departureTimeLabel = formatDepartureTime(chargingData?.departureTime);
  const showSetupCard = chargeModeLabel != null || departureTimeLabel != null;

  const canStop = isCharging || chargingData?.status === 'CHARGING';
  const isStoppingState = chargingData?.status === 'STOPPING';
  const showStopButton = canStop && !isStoppingState;

  // Al restaurar sesión tras reabrir la app, normalmente NO existe `scanQrResponse` (no hay QR escaneado).
  // La fuente de verdad para mostrar esta pantalla debe ser `chargingData.sessionId`.
  if (!effectiveSessionId) {
    return (
      <Fragment>
        <SafeAreaView
          style={[styles.flex1, { backgroundColor: screenBackground }]}
          edges={['top', 'bottom']}
        >
          <Layout level="1" style={styles.flex1}>
          <Layout style={styles.centeredBlock}>
            <Text category="s1" appearance="hint" style={styles.emptyText}>
              No hay sesión activa
            </Text>
            <Button status="primary" onPress={() => replaceToRoute('App')} style={styles.primaryButton}>
              Volver al inicio
            </Button>
          </Layout>
          </Layout>
        </SafeAreaView>
        {InfoDialog}
        {ConfirmDialog}
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
        <Layout style={styles.header}>
          <Text category="h5" style={styles.screenTitle}>
            Sesión de Carga
          </Text>
          <Text status="primary" category="s1" style={styles.inProgressText}>
            Carga en curso
          </Text>
          {!isWsConnected && (
            <Layout style={styles.wsBanner} level="2">
              <Text category="c1" appearance="hint" style={styles.wsBannerText}>
                {wsError ?? 'Conectando en tiempo real…'}
              </Text>
              {wsError ? (
                <Button
                  size="small"
                  appearance="outline"
                  status="basic"
                  style={styles.wsReconnect}
                  onPress={() => reconnect()}
                >
                  Reintentar conexión
                </Button>
              ) : null}
            </Layout>
          )}
        </Layout>

        <Layout style={styles.powerRow} level="2">
          <Layout style={styles.powerLeft} level="2">
            <Text category="c1" appearance="hint" style={styles.costLabel}>
              Potencia
            </Text>
            <View style={styles.powerValueRow}>
              <Text style={styles.costValue}>
                {Number.isFinite(displayPower) ? Number(displayPower).toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.powerUnitInline}>kW</Text>
            </View>
          </Layout>
          <View style={[styles.powerDivider, { backgroundColor: colors.border }]} />
          <Layout style={styles.powerRight} level="2">
            <Text category="c1" appearance="hint" style={styles.costLabel}>
              Costo acumulado
            </Text>
            <Text style={styles.costValue}>
              {formatAccumulatedCostClp(displayCostClp)} CLP
            </Text>
          </Layout>
        </Layout>

        {typeof displayTariffClpPerKwh === 'number' && (
          <Layout style={[styles.card, { borderColor: colors.border }]} level="2">
            <Text category="label" appearance="hint">
              Tarifa
            </Text>
            <Text category="s1">
              {Math.round(displayTariffClpPerKwh).toLocaleString('es-CL')} CLP/kWh
            </Text>
          </Layout>
        )}

        <ChargeProgressCard
          energyKwh={displayEnergy}
          startedAt={sessionStartedAt}
          socPercent={displayPercentage}
          targetEnergyKwh={chargingData?.estimatedEnergyKwh}
        />

        {showSetupCard && (
          <Layout style={styles.setupRow} level="2">
            <Layout style={styles.setupCol} level="2">
              <Text category="c1" appearance="hint" style={styles.costLabel}>
                Modo de carga
              </Text>
              <Text style={styles.setupValue}>{chargeModeLabel ?? '—'}</Text>
            </Layout>
            <View style={[styles.powerDivider, { backgroundColor: colors.border }]} />
            <Layout style={[styles.setupCol, styles.setupColRight]} level="2">
              <Text
                category="c1"
                appearance="hint"
                style={[styles.costLabel, styles.setupLabelRight]}
              >
                Horario de salida
              </Text>
              <Text style={[styles.setupValue, styles.setupValueRight]}>
                {departureTimeLabel ?? '—'}
              </Text>
            </Layout>
          </Layout>
        )}

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
      </Layout>
    </SafeAreaView>
    {InfoDialog}
    {ConfirmDialog}
    </Fragment>
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
  wsBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  wsBannerText: {
    textAlign: 'center',
  },
  wsReconnect: {
    marginTop: 4,
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
    flex: 1,
  },
  powerValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  powerUnitInline: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  powerDivider: {
    width: 1,
    height: 32,
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
    alignItems: 'flex-start',
    marginTop: 14,
    gap: 16,
  },
  progressMetricCol: {
    flex: 1,
  },
  progressMetricColRight: {
    alignItems: 'flex-end',
  },
  progressMetricLabelRight: {
    textAlign: 'right',
  },
  progressMetricValueRight: {
    textAlign: 'right',
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  setupCol: {
    flex: 1,
  },
  setupColRight: {
    alignItems: 'flex-end',
  },
  setupValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  setupValueRight: {
    textAlign: 'right',
  },
  setupLabelRight: {
    textAlign: 'right',
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
  dangerButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
});
