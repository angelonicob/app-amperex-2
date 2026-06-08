import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Layout, Text, Spinner } from '@ui-kitten/components';
import type { TextProps } from '@ui-kitten/components/ui/text/text.component';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  type ReactNode,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getPlugStatus,
  checkSessionStatus,
  startSession as startSessionApi,
  cancelSessionIntent,
  type PlugStatusResponse,
  type ChargeProfile,
  type SessionStatusResponse,
  type StartSessionPaymentRequired,
} from '../../../modules/session/session';
import {
  ChargingData,
  useSessionStore,
} from '../../../modules/session/store/useSessionStore';
import { useActiveSessionStore } from '../../../modules/session/store/useActiveSessionStore';
import { useSessionWebSocket } from '../../../shared/hooks/useSessionWebSocket';
import type { SessionStackParams } from '../../routes/navigationParams';
import { replaceToRoute } from '../../routes/navigationRef';
import { getFirebaseIdToken } from '../../../infrastructure/firebase/firebaseSession';
import { useAccountStore } from '../../../modules/user/store/useAccountStore';
import { formatLocalDateKey } from '../../../modules/reservation/reservationApi';
import { useReservationStore } from '../../../modules/reservation/store/useReservationStore';
import type { Car } from '../../../modules/user/types/car';
import {
  EmptyStateLayout,
  PLUG_CONNECT_DEFAULT_TITLE,
  PLUG_CONNECT_ICON,
} from '../../../shared/components/layout/EmptyStateLayout';
import { HeaderFlow } from '../../../shared/components/session/HeaderFlow';
import { ConnectorInfo } from '../../../shared/components/session/ConnectorInfo';
import { CarCardVertical } from '../../../shared/components/ui/card';
import { ButtonPrimary } from '../../../shared/components/ui/button';
import type { TimePickerColumnsValue } from '../../../shared/components/session/TimePickerColumns';
import { ConnectorEndTimeStep } from '../../../shared/components/schedule/ConnectorEndTimeStep';
import { PreparingSessionCard } from '../../../shared/components/session/PreparingSessionCard';
import { SectionSelect } from '../../../shared/components/session/SectionSelect';
import { MetaCharge } from '../../../shared/components/session/MetaCharge';
import { ChargeTargetPicker } from '../../../shared/components/session/ChargeTargetPicker';
import { useInfoDialog } from '../../../shared/hooks/useInfoDialog';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useSystemChrome } from '../../../shared/hooks/useSystemChrome';
import {
  buildEndTimeScheduleContext,
  departureTimeValueToDate,
  formatTimePickerValue,
  validateEndTime,
} from '../../../shared/utils/connectorSchedule';
import { navigateToSessionCompletion } from '../../../shared/utils/navigateToSessionCompletion';
import { formatConnectorCode } from '../../../shared/utils/connectorDisplay';

type Nav = StackNavigationProp<SessionStackParams, 'Parámetros'>;

const QUICK_AMOUNTS_CLP = [10000, 20000, 30000, 40000, 50000, 60000] as const;
const QUICK_ENERGY_KWH = [10, 20, 30, 40, 50, 60] as const;

const PLUG_WAIT_HINT =
  'Conecta el cable al vehículo. Detectaremos la conexión automáticamente.';

/** Si el backend ya reporta sesión en carga, ir a la pantalla sin esperar al WebSocket (p. ej. 429 en upgrade). */
function tryNavigateToChargeFromStatus(
  status: SessionStatusResponse,
  navigation: Nav,
  setChargingData: (d: ChargingData | null) => void,
  setIsCharging: (v: boolean) => void,
  setIsAwaitingStartAck: (v: boolean) => void,
  setStartAckSessionId: (id: string | null) => void,
  priceClpPerKwh?: number | null,
): boolean {
  if (!status.ready || !status.sessionId) return false;
  const st = status.status;
  if (st !== 'CHARGING' && st !== 'STOPPING') return false;
  setStartAckSessionId(null);
  setChargingData({
    sessionId: status.sessionId,
    status: st as 'CHARGING' | 'STOPPING',
    ...(typeof priceClpPerKwh === 'number' &&
    Number.isFinite(priceClpPerKwh) &&
    priceClpPerKwh > 0
      ? { priceClpPerKwh, currency: 'CLP' as const }
      : {}),
  });
  setIsCharging(true);
  setIsAwaitingStartAck(false);
  void useActiveSessionStore.getState().hydrateFromBackend();
  navigation.navigate('Sesión');
  return true;
}

function toFiniteNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Soportar coma decimal y limpiar unidades
    const cleaned = trimmed.replace(',', '.').replace(/[^\d.+-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

export const StartSessionScreen = () => {
  const navigation = useNavigation<Nav>();
  const [isPlugReady, setIsPlugReady] = useState(false);
  const [lastPlugStatus, setLastPlugStatus] = useState<PlugStatusResponse | null>(null);
  const [plugStatusText, setPlugStatusText] = useState(PLUG_WAIT_HINT);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<number | null>(null);
  const [departureTime, setDepartureTime] = useState<TimePickerColumnsValue | null>(
    null,
  );
  const [chargeSection, setChargeSection] = useState<'CLP' | 'ENERGY' | 'FULL'>('CLP');
  const [amountClp, setAmountClp] = useState<string>('10000');
  const [energyKw, setEnergyKw] = useState<string>('');
  const [initialSocPercent, setInitialSocPercent] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAwaitingStartAck, setIsAwaitingStartAck] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [startAckError, setStartAckError] = useState<string | null>(null);
  const [startAckTimedOut, setStartAckTimedOut] = useState(false);
  const { vehicles, fetchVehicles } = useAccountStore();
  const agenda = useReservationStore((s) => s.agenda);
  const {
    scanQrResponse,
    setChargingData,
    setIsCharging,
    startSession,
  } = useSessionStore();
  const [departureTimeValid, setDepartureTimeValid] = useState(false);
  const [startAckSessionId, setStartAckSessionId] = useState<string | null>(null);

  const colors = useAppTheme();
  const screenBackground = useSystemChrome();
  const { showInfo, InfoDialog } = useInfoDialog();
  const wrap = (node: ReactNode) => (
    <Fragment>
      {node}
      {InfoDialog}
    </Fragment>
  );

  const {
    isConnected: isWebSocketConnected,
    lastUpdate,
    error: wsError,
  } = useSessionWebSocket(startAckSessionId);

  useEffect(() => {
    if (step !== 3) setChargeSection('CLP');
  }, [step]);

  useFocusEffect(
    useCallback(() => {
      fetchVehicles();
    }, [fetchVehicles]),
  );

  const programmedReservation = scanQrResponse?.programmedReservation;

  const programmedWindowLabel = useMemo(() => {
    if (!programmedReservation?.startAtLocal || !programmedReservation?.endAtLocal) {
      return null;
    }
    const start = programmedReservation.startAtLocal.slice(11, 16);
    const end = programmedReservation.endAtLocal.slice(11, 16);
    return `${start} – ${end}`;
  }, [programmedReservation?.startAtLocal, programmedReservation?.endAtLocal]);

  const connectorId =
    lastPlugStatus?.connector?.id ?? scanQrResponse?.connector?.id ?? null;

  const sessionDateKey = useMemo(() => formatLocalDateKey(new Date()), []);

  const openStep2 = useCallback(() => {
    if (programmedReservation) {
      setStep(3);
      return;
    }
    setStep(2);
  }, [programmedReservation]);

  useFocusEffect(
    useCallback(() => {
      // Al entrar a esta pantalla dejamos CLP como sección por defecto
      setChargeSection('CLP');
      setAmountClp('10000');
      setEnergyKw('');
    }, []),
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const run = async () => {
      if (!scanQrResponse?.correlationId) return;
      const res = await getPlugStatus(scanQrResponse.correlationId);
      if (cancelled || !res) return;

      setLastPlugStatus(res);

      if (res.reservationExpiresAt) {
        const exp = new Date(res.reservationExpiresAt).getTime();
        if (Date.now() > exp) {
          setPlugStatusText('La reserva expiró. Escanea el QR nuevamente.');
          return;
        }
      }

      if (res.readyToStart) {
        setIsPlugReady(true);
      }
    };

    if (!isPlugReady && scanQrResponse?.correlationId) {
      run();
      interval = setInterval(run, 1500);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [isPlugReady, scanQrResponse?.correlationId]);

  const cancelStartIntent = useCallback(async () => {
    const correlationId = scanQrResponse?.correlationId;
    if (!correlationId) return;
    await cancelSessionIntent(correlationId);
  }, [scanQrResponse?.correlationId]);

  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'session-update') {
      if (isAwaitingStartAck && lastUpdate.data.status === 'FAILED') {
        void cancelStartIntent();
        setStartAckError(
          lastUpdate.data.message ||
            lastUpdate.data.reason ||
            'No se pudo iniciar la sesión de carga.',
        );
        setIsAwaitingStartAck(false);
      }
      const sessionData: ChargingData = {
        sessionId: lastUpdate.data.sessionId,
        status: lastUpdate.data.status as 'CHARGING' | 'STOPPING' | 'FINISHED',
        ocppTransactionId: lastUpdate.data.ocppTransactionId
          ? parseInt(lastUpdate.data.ocppTransactionId)
          : undefined,
        startedAt: lastUpdate.data.startedAt,
        meterStart: lastUpdate.data.meterStart,
        energyKwh: lastUpdate.data.energyKwh,
        powerKw: lastUpdate.data.powerKw,
        currentPercentage: lastUpdate.data.currentPercentage,
        currentCost: lastUpdate.data.currentCost,
        ...(lastUpdate.data.totalCost != null
          ? { totalCost: lastUpdate.data.totalCost }
          : {}),
        ...(lastUpdate.data.totalDurationSeconds != null
          ? { totalDurationSeconds: lastUpdate.data.totalDurationSeconds }
          : {}),
        ...(lastUpdate.data.finalPercentage != null
          ? { finalPercentage: lastUpdate.data.finalPercentage }
          : {}),
        ...(lastUpdate.data.currency
          ? { currency: lastUpdate.data.currency }
          : {}),
        ...(lastUpdate.data.pricePerKwh != null
          ? { priceClpPerKwh: lastUpdate.data.pricePerKwh }
          : {}),
        voltageV: lastUpdate.data.voltageV,
        currentA: lastUpdate.data.currentA,
        timestamp: lastUpdate.data.timestamp || lastUpdate.timestamp,
        finalEnergy: lastUpdate.data.finalEnergy,
        reason: lastUpdate.data.reason,
        finishedAt: lastUpdate.data.finishedAt,
        message: lastUpdate.data.message,
      };

      setChargingData(sessionData);

      const currentIsCharging = useSessionStore.getState().isCharging;
      if (
        sessionData.status === 'CHARGING' &&
        sessionData.sessionId &&
        !currentIsCharging
      ) {
        setIsCharging(true);
        navigation.navigate('Sesión');
      }

      if (sessionData.status === 'FINISHED') {
        setIsCharging(false);
      }
    }
  }, [lastUpdate, setChargingData, setIsCharging, navigation, isAwaitingStartAck, cancelStartIntent]);

  useEffect(() => {
    if (!isAwaitingStartAck || !scanQrResponse?.correlationId) return;
    let cancelled = false;
    const correlationId = scanQrResponse.correlationId;

    const poll = async () => {
      const status = await checkSessionStatus(correlationId);
      if (cancelled || !status) return;
      tryNavigateToChargeFromStatus(
        status,
        navigation,
        setChargingData,
        setIsCharging,
        setIsAwaitingStartAck,
        setStartAckSessionId,
        lastPlugStatus?.connector?.price,
      );
    };

    void poll();
    const intervalId = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [
    isAwaitingStartAck,
    scanQrResponse?.correlationId,
    lastPlugStatus?.connector?.price,
    navigation,
    setChargingData,
    setIsCharging,
  ]);

  useEffect(() => {
    if (!isAwaitingStartAck) {
      setStartAckTimedOut(false);
      return;
    }
    setStartAckTimedOut(false);
    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      if (cancelled) return;
      setStartAckTimedOut(true);
      // Intento de recuperación: consultar estado y, si existe, unirse a la sesión.
      const correlationId = scanQrResponse?.correlationId;
      if (!correlationId) return;
      const status = await checkSessionStatus(correlationId);
      if (cancelled || !status) return;
      if (
        tryNavigateToChargeFromStatus(
          status,
          navigation,
          setChargingData,
          setIsCharging,
          setIsAwaitingStartAck,
          setStartAckSessionId,
          lastPlugStatus?.connector?.price,
        )
      ) {
        return;
      }
      if (status.ready && status.sessionId) {
        setStartAckSessionId(status.sessionId);
      } else if (status.status === 'FAILED') {
        void cancelStartIntent();
        setStartAckError(status.message || 'No se pudo iniciar la sesión de carga.');
        setIsAwaitingStartAck(false);
      }
    }, 18000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAwaitingStartAck, scanQrResponse?.correlationId, cancelStartIntent, navigation, setChargingData, setIsCharging, setStartAckSessionId, lastPlugStatus?.connector?.price]);

  useEffect(() => {
    if (wsError) {
      showInfo('Error de conexión', wsError);
    }
  }, [wsError, showInfo]);

  const connectorInfoProps = useMemo(() => {
    const conn = lastPlugStatus?.connector;
    if (!conn) {
      return { connectorType: undefined, price: undefined, powerKw: undefined };
    }
    const code = formatConnectorCode(conn.connectorType, conn.connectorNumber);
    return {
      connectorType: code !== '—' ? code : undefined,
      price:
        conn.price != null ? `${conn.price} / kWh` : undefined,
      powerKw: conn.powerKw != null ? `${conn.powerKw} kW` : undefined,
    };
  }, [lastPlugStatus]);

  const selectedVehicle: Car | null =
    selectedVehicleIndex != null && vehicles[selectedVehicleIndex]
      ? vehicles[selectedVehicleIndex]
      : null;

  const handleConfirmDepartureStep = useCallback(() => {
    if (!departureTime || !agenda) {
      showInfo('Horario', 'Selecciona una hora de salida.');
      return;
    }
    const ctx = buildEndTimeScheduleContext(agenda, {
      mode: 'session',
      dateKey: sessionDateKey,
      programmedReservation,
    });
    const err = validateEndTime(
      departureTime,
      ctx,
      scanQrResponse?.user?.id,
    );
    if (err) {
      showInfo('Horario inválido', err);
      return;
    }
    if (!departureTimeValid) {
      showInfo('Horario inválido', 'El horario seleccionado no está disponible.');
      return;
    }
    setStep(3);
  }, [
    agenda,
    departureTime,
    departureTimeValid,
    programmedReservation,
    scanQrResponse?.user?.id,
    sessionDateKey,
    showInfo,
  ]);

  const resolveDepartureTimeIso = useCallback((): string | null => {
    if (programmedReservation?.endAt) {
      return new Date(programmedReservation.endAt).toISOString();
    }
    if (!departureTime) return null;
    return departureTimeValueToDate(departureTime).toISOString();
  }, [departureTime, programmedReservation?.endAt]);

  const handleStartSession = async () => {
    if (selectedVehicleIndex == null) {
      showInfo('Error', 'Selecciona un vehículo');
      return;
    }
    if (!isPlugReady) {
      showInfo(
        'Error',
        'Espera a que el vehículo esté conectado (Preparing)',
      );
      return;
    }
    if (!scanQrResponse) {
      showInfo('Error', 'Sesión no inicializada');
      return;
    }

    const vehicle = vehicles[selectedVehicleIndex];
    if (!vehicle) {
      showInfo('Error', 'Vehículo no válido');
      return;
    }

    const departureTimeIso = resolveDepartureTimeIso();
    if (!departureTimeIso) {
      showInfo(
        'Horario',
        programmedReservation
          ? 'No se pudo obtener el horario de fin de tu reserva.'
          : 'Selecciona una hora de salida en el paso anterior.',
      );
      return;
    }

    if (!programmedReservation) {
      if (!departureTime || !agenda) {
        showInfo('Horario', 'Selecciona una hora de salida en el paso anterior.');
        return;
      }
      const scheduleCtx = buildEndTimeScheduleContext(agenda, {
        mode: 'session',
        dateKey: sessionDateKey,
        programmedReservation,
      });
      const departureError = validateEndTime(
        departureTime,
        scheduleCtx,
        scanQrResponse.user?.id,
      );
      if (departureError) {
        showInfo('Horario inválido', departureError);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      setStartAckError(null);
      setStartAckTimedOut(false);
      const init = Number(initialSocPercent) || 0;
      const pricePerKwhNum = lastPlugStatus?.connector?.price ?? 0;

      /** Horario de salida + potencia del conector (OCPP charge profile); el tope kWh lo resuelve el backend. */
      const buildChargeProfileBase = (): ChargeProfile => {
        const chargeProfile: ChargeProfile = {
          departureTime: departureTimeIso,
        };
        const connectorPower = toFiniteNumber(lastPlugStatus?.connector?.powerKw);
        if (connectorPower != null && connectorPower >= 0) {
          chargeProfile.maxPowerKw = connectorPower;
        }
        return chargeProfile;
      };

      let startPayload: Parameters<typeof startSessionApi>[0];

      if (chargeSection === 'FULL') {
        startPayload = {
          correlationId: scanQrResponse.correlationId,
          vehicleId: vehicle.id,
          mode: 'FULL',
          initialSocPercent: init,
          chargeProfile: buildChargeProfileBase(),
        };
      } else if (chargeSection === 'CLP') {
        const clp = parseInt(amountClp.replace(/\D/g, ''), 10);
        if (!Number.isFinite(clp) || clp <= 0) {
          showInfo('Error', 'Ingresa un monto válido en CLP.');
          return;
        }
        if (pricePerKwhNum <= 0) {
          showInfo(
            'Sin tarifa',
            'Este conector no tiene precio por kWh; no se puede limitar la carga por monto.',
          );
          return;
        }
        const base = buildChargeProfileBase();
        const energyHint = clp / pricePerKwhNum;
        if (Number.isFinite(energyHint) && energyHint >= 0) {
          base.targetEnergy = energyHint;
        }
        startPayload = {
          correlationId: scanQrResponse.correlationId,
          vehicleId: vehicle.id,
          mode: 'AMOUNT',
          initialSocPercent: init,
          targetAmountClp: clp,
          chargeProfile: Object.keys(base).length > 0 ? base : undefined,
        };
      } else {
        const energy = toFiniteNumber(energyKw);
        if (energy == null || energy <= 0) {
          showInfo('Error', 'Ingresa una cantidad de energía válida (kWh).');
          return;
        }
        const base = buildChargeProfileBase();
        base.targetEnergy = energy;
        startPayload = {
          correlationId: scanQrResponse.correlationId,
          vehicleId: vehicle.id,
          mode: 'TARGET',
          initialSocPercent: init,
          targetEnergyKwh: energy,
          chargeProfile: Object.keys(base).length > 0 ? base : undefined,
        };
      }

      const response = await startSessionApi(startPayload);

      if (
        response != null &&
        (response as StartSessionPaymentRequired).paymentRequired === true
      ) {
        await navigateToSessionCompletion(
          (response as StartSessionPaymentRequired).pendingSessionId,
        );
        return;
      }

      if (response != null && 'success' in response && response.success) {
        // Sembrar el store con los parámetros locales (mode + departureTime) para que
        // SessionChargeScreen pueda mostrarlos sin un viaje extra al backend.
        setChargingData({
          mode: startPayload.mode,
          departureTime: departureTimeIso,
          ...(pricePerKwhNum > 0
            ? {
                priceClpPerKwh: pricePerKwhNum,
                currency: 'CLP',
                currentCost: 0,
                energyKwh: 0,
              }
            : {}),
        });
        setIsAwaitingStartAck(true);
        // El WS se conectará cuando tengamos `sessionId` (vía session-update o checkSessionStatus).
        setStartAckSessionId(null);
      } else {
        showInfo('Error', 'No se pudo iniciar la carga');
      }
    } catch {
      showInfo('Error', 'No se pudo iniciar la sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = async () => {
    await cancelStartIntent();
    useSessionStore.getState().clearSession();
    replaceToRoute('App');
  };

  const pricePerKwh = lastPlugStatus?.connector?.price ?? 0;

  const scrollToChargeInput = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  const stepScrollContentStyle = useMemo(
    () => [
      styles.stepContent,
      step === 3 ? styles.stepContentConfirm : styles.stepContentCentered,
    ],
    [step],
  );

  if (!isPlugReady) {
    const isReservationExpired = plugStatusText.includes('expiró');

    return wrap(
      <EmptyStateLayout
        fullScreen
        title={PLUG_CONNECT_DEFAULT_TITLE}
        subtitle={isReservationExpired ? plugStatusText : PLUG_WAIT_HINT}
        icon={PLUG_CONNECT_ICON}
        action={{
          label: 'Volver',
          onPress: handleGoBack,
          appearance: 'ghost',
          status: 'danger',
        }}
      />,
    );
  }

  if (isAwaitingStartAck) {
    return wrap(
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top', 'bottom']}
      >
        <Layout level="1" style={styles.flex1}>
        <Layout style={styles.centeredBlock}>
          <Spinner size="giant" status="primary" />
          <Text category="s1" style={styles.blockTitle}>
            Preparando tu sesión de carga...
          </Text>
          <Text category="s2" appearance="hint" style={styles.blockSubtitle}>
            {startAckTimedOut
              ? 'Está tardando más de lo normal. Revisa el estado y vuelve a intentar.'
              : 'Esto puede tomar unos segundos mientras confirmamos la sesión.'}
          </Text>
          {startAckTimedOut ? (
            <ButtonPrimary
              title="Reintentar"
              onPress={async () => {
                const correlationId = scanQrResponse?.correlationId;
                if (!correlationId) return;
                setStartAckTimedOut(false);
                const status = await checkSessionStatus(correlationId);
                if (!status) {
                  showInfo('Error', 'No se pudo verificar el estado de la sesión.');
                  return;
                }
                if (
                  tryNavigateToChargeFromStatus(
                    status,
                    navigation,
                    setChargingData,
                    setIsCharging,
                    setIsAwaitingStartAck,
                    setStartAckSessionId,
                    lastPlugStatus?.connector?.price,
                  )
                ) {
                  return;
                }
                if (status.ready && status.sessionId) {
                  // Esto hará que el hook conecte al WS y haga join automáticamente.
                  setStartAckSessionId(status.sessionId);
                } else if (status.status === 'FAILED') {
                  void cancelStartIntent();
                  setStartAckError(status.message || 'No se pudo iniciar la sesión de carga.');
                  setIsAwaitingStartAck(false);
                } else {
                  setStartAckTimedOut(true);
                }
              }}
              style={styles.primaryButton}
            />
          ) : null}
          <Button
            appearance="outline"
            status="danger"
            onPress={handleGoBack}
            style={styles.secondaryButton}
          >
            Cancelar
          </Button>
        </Layout>
        </Layout>
      </SafeAreaView>,
    );
  }

  if (startAckError) {
    return wrap(
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top', 'bottom']}
      >
        <Layout level="1" style={styles.flex1}>
        <Layout style={styles.centeredBlock}>
          <Text category="h6" style={styles.blockTitle}>
            No se pudo iniciar la sesión
          </Text>
          <Text category="s2" appearance="hint" style={styles.blockSubtitle}>
            {startAckError}
          </Text>
          <ButtonPrimary
            title="Volver"
            onPress={async () => {
              await cancelStartIntent();
              setStartAckError(null);
              setIsAwaitingStartAck(false);
              useSessionStore.getState().clearSession();
              replaceToRoute('App');
            }}
            style={styles.primaryButton}
          />
        </Layout>
        </Layout>
      </SafeAreaView>,
    );
  }

  const stepTitles: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
    1: {
      title: programmedReservation ? 'Reserva programada' : 'Seleccionar Vehículo',
      subtitle: programmedReservation
        ? 'Selecciona el vehículo que vas a cargar'
        : 'Selecciona tu vehículo a cargar',
    },
    2: {
      title: 'Seleccionar Horario',
      subtitle: 'Elige tu horario de salida',
    },
    3: {
      title: 'Confirmar',
      subtitle: 'Revisa y inicia la carga',
    },
  };

  const sections = [
    { id: 'CLP' as const, label: '$ CLP' },
    { id: 'ENERGY' as const, label: 'Energía (kWh)' },
    { id: 'FULL' as const, label: 'Carga total' },
  ];

  const formatClp = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '$0';
    const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${withDots}`;
  };

  const clpAmountNumber = parseInt(amountClp.replace(/\D/g, ''), 10);
  const clpAmountValid = Number.isFinite(clpAmountNumber) && clpAmountNumber > 0;
  const energyKwhNumber = toFiniteNumber(energyKw);
  const energyKwhValid = energyKwhNumber != null && energyKwhNumber > 0;

  /** Estimado recíproco: si el target es CLP mostramos kWh; si es energía mostramos CLP. */
  const clpTargetEstimate =
    clpAmountValid && pricePerKwh > 0
      ? `Energía estimada: ~${(clpAmountNumber / pricePerKwh).toFixed(1)} kWh`
      : pricePerKwh <= 0
        ? 'Sin tarifa configurada para este conector'
        : null;
  const energyTargetEstimate =
    energyKwhValid && pricePerKwh > 0
      ? `Costo estimado: ~${formatClp(String(Math.round((energyKwhNumber as number) * pricePerKwh)))}`
      : pricePerKwh <= 0
        ? 'Sin tarifa configurada para este conector'
        : null;

  return wrap(
    <SafeAreaView
      style={[styles.flex1, { backgroundColor: screenBackground }]}
      edges={['top', 'bottom']}
    >
      <Layout level="1" style={styles.flex1}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.stickyHeader}>
          <HeaderFlow
            title={stepTitles[step].title}
            subtitle={stepTitles[step].subtitle}
            onBack={
              step > 1
                ? () =>
                    setStep((s) => {
                      if (s === 3 && programmedReservation) return 1;
                      return (s - 1) as 1 | 2 | 3;
                    })
                : undefined
            }
          />
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={stepScrollContentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepInner}>
            {(step === 1 || step === 2) && (
              <ConnectorInfo {...connectorInfoProps} />
            )}
            {programmedReservation && programmedWindowLabel ? (
              <View
                style={[
                  styles.programmedBanner,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text category="s1" style={{ color: colors.text }}>
                  Tienes una reserva activa
                </Text>
                <Text appearance="hint" style={styles.programmedBannerHint}>
                  Horario {programmedWindowLabel}. Conecta en el conector asignado.
                </Text>
              </View>
            ) : null}
            {step === 1 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.cardsScroll}
                  contentContainerStyle={styles.cardsRow}
                >
                  {vehicles.map((v, i) => (
                    <CarCardVertical
                      key={v.id}
                      vehicle={v}
                      selected={selectedVehicleIndex === i}
                      onSelect={() =>
                        setSelectedVehicleIndex((prev) => (prev === i ? null : i))
                      }
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {step === 2 && connectorId ? (
              <ConnectorEndTimeStep
                mode="session"
                connectorId={connectorId}
                dateKey={sessionDateKey}
                stationName={scanQrResponse?.station?.name}
                programmedReservation={programmedReservation}
                currentUserId={scanQrResponse?.user?.id}
                value={departureTime}
                onChange={setDepartureTime}
                onValidityChange={setDepartureTimeValid}
              />
            ) : null}

            {step === 3 && selectedVehicle && (
              <>
                <PreparingSessionCard
                  vehicle={selectedVehicle}
                  chargePointName={scanQrResponse?.chargePoint?.ocppId ?? '—'}
                  connectorName={formatConnectorCode(
                    lastPlugStatus?.connector?.connectorType ??
                      (scanQrResponse as any)?.connector?.connectorType ??
                      null,
                    lastPlugStatus?.connector?.connectorNumber,
                  )}
                  departureText={
                    departureTime != null
                      ? `Salida: ${formatTimePickerValue(departureTime)}`
                      : undefined
                  }
                  priceText={
                    pricePerKwh > 0 ? `$${pricePerKwh} / kWh` : undefined
                  }
                />
                <SectionSelect
                  sections={sections}
                  activeId={chargeSection}
                  onSelect={(id) => setChargeSection(id as 'CLP' | 'ENERGY' | 'FULL')}
                />
                {chargeSection === 'CLP' && (
                  <ChargeTargetPicker
                    displayValue={formatClp(amountClp)}
                    inputValue={amountClp ? formatClp(amountClp) : ''}
                    onChangeInput={(text) =>
                      setAmountClp(text.replace(/\D/g, ''))
                    }
                    suggestions={QUICK_AMOUNTS_CLP}
                    formatSuggestion={(amt) => `$${(amt / 1000).toFixed(0)}k`}
                    suggestionSubtitle={(amt) => formatClp(String(amt))}
                    isSuggestionSelected={(amt) => amountClp === String(amt)}
                    onSelectSuggestion={(amt) => setAmountClp(String(amt))}
                    placeholder="Monto en pesos (CLP)"
                    keyboardType="numeric"
                    onInputFocus={scrollToChargeInput}
                    estimate={clpTargetEstimate}
                  />
                )}
                {chargeSection === 'ENERGY' && (
                  <ChargeTargetPicker
                    displayValue={`${energyKw || '0'} kWh`}
                    inputValue={energyKw}
                    onChangeInput={setEnergyKw}
                    suggestions={QUICK_ENERGY_KWH}
                    formatSuggestion={(kwh) => `${kwh} kWh`}
                    isSuggestionSelected={(kwh) => {
                      const n = toFiniteNumber(energyKw);
                      return n != null && Math.abs(n - kwh) < 1e-6;
                    }}
                    onSelectSuggestion={(kwh) => setEnergyKw(String(kwh))}
                    placeholder="Energía en kWh"
                    keyboardType="decimal-pad"
                    onInputFocus={scrollToChargeInput}
                    estimate={energyTargetEstimate}
                  />
                )}
                {chargeSection === 'FULL' && (
                  <View style={styles.sectionContent}>
                    <MetaCharge value="Carga completa" icon="energy" />
                  </View>
                )}
              </>
            )}

            {(step === 1 || step === 2) && (
              <View style={styles.footer}>
                <View style={styles.dots}>
                  {[1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            step >= i ? colors.primary : colors.borderDark,
                        },
                      ]}
                    />
                  ))}
                </View>
                {step === 1 && (
                  <ButtonPrimary
                    title="Siguiente"
                    onPress={openStep2}
                    disabled={selectedVehicleIndex == null}
                    style={styles.stepButton}
                  />
                )}
                {step === 2 && (
                  <ButtonPrimary
                    title="Confirmar Salida"
                    onPress={handleConfirmDepartureStep}
                    disabled={!departureTimeValid || !connectorId}
                    style={styles.stepButton}
                  />
                )}
                <Button
                  appearance="ghost"
                  status="basic"
                  onPress={handleGoBack}
                  style={styles.footerGhostCancel}
                >
                  {(evaProps: TextProps) => (
                    <Text
                      {...evaProps}
                      style={[evaProps.style, { color: colors.danger }]}
                    >
                      Cancelar
                    </Text>
                  )}
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
        {step === 3 && selectedVehicle ? (
          <View
            style={[
              styles.stickyBottom,
              {
                backgroundColor: screenBackground,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={styles.dots}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        step >= i ? colors.primary : colors.borderDark,
                    },
                  ]}
                />
              ))}
            </View>
            <ButtonPrimary
              title={isSubmitting ? 'Enviando...' : 'Iniciar carga'}
              onPress={handleStartSession}
              disabled={isSubmitting}
              style={styles.primaryButton}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
      </Layout>
    </SafeAreaView>,
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  centeredBlock: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockTitle: { textAlign: 'center', marginBottom: 8 },
  blockSubtitle: { textAlign: 'center', marginBottom: 28, paddingHorizontal: 8 },
  stepContent: {
    padding: 20,
    flexGrow: 1,
  },
  stepContentCentered: {
    paddingBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContentConfirm: {
    paddingBottom: 240,
    alignItems: 'center',
  },
  stepInner: {
    width: '100%',
    gap: 24,
  },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  stickyBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  programmedBanner: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  programmedBannerHint: {
    lineHeight: 20,
  },
  cardsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  sectionContent: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  primaryButton: { width: '100%', marginTop: 8 },
  secondaryButton: { width: '100%', marginTop: 12 },
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepButton: { width: '100%' },
  footerGhostCancel: {
    width: '100%',
    marginTop: -4,
  },
});
