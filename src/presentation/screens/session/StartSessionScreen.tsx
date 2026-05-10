import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Button, Input, Layout, Text, Spinner } from '@ui-kitten/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  estimateSession,
  getPlugStatus,
  checkSessionStatus,
  type ChargingMode,
  type PlugStatusResponse,
  type ChargeProfile,
} from '../../../modules/session/session';
import {
  ChargingData,
  useSessionStore,
} from '../../../modules/session/store/useSessionStore';
import { useSessionWebSocket } from '../../../shared/hooks/useSessionWebSocket';
import type { SessionStackParams } from '../../routes/navigationParams';
import { replaceToRoute } from '../../routes/navigationRef';
import { getFirebaseIdToken } from '../../../infrastructure/firebase/firebaseSession';
import { useAccountStore } from '../../../modules/user/store/useAccountStore';
import type { Car } from '../../../modules/user/types/car';
import { HeaderFlow } from '../../../shared/components/session/HeaderFlow';
import { ConnectorInfo } from '../../../shared/components/session/ConnectorInfo';
import { CarCardVertical } from '../../../shared/components/ui/card';
import { TimePickerColumns, type TimePickerColumnsValue } from '../../../shared/components/session/TimePickerColumns';
import { PreparingSessionCard } from '../../../shared/components/session/PreparingSessionCard';
import { SectionSelect } from '../../../shared/components/session/SectionSelect';
import { MetaCharge } from '../../../shared/components/session/MetaCharge';

type Nav = StackNavigationProp<SessionStackParams, 'Parámetros'>;

const QUICK_AMOUNTS = [10000, 20000, 30000, 40000, 50000, 60000];

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
  const [plugStatusText, setPlugStatusText] = useState(
    'Esperando conexión del vehículo...',
  );
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState<number | null>(null);
  const [departureTime, setDepartureTime] = useState<TimePickerColumnsValue>({
    hour: 12,
    minute: 0,
    ampm: 'PM',
  });
  const [chargeSection, setChargeSection] = useState<'CLP' | 'ENERGY' | 'FULL'>('CLP');
  const [amountClp, setAmountClp] = useState<string>('10000');
  const [energyKw, setEnergyKw] = useState<string>('');
  const [mode, setMode] = useState<ChargingMode>('TARGET');
  const [initialSocPercent, setInitialSocPercent] = useState('0');
  const [targetSocPercent, setTargetSocPercent] = useState('80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [isAwaitingStartAck, setIsAwaitingStartAck] = useState(false);
  const [startAckError, setStartAckError] = useState<string | null>(null);
  const [startAckTimedOut, setStartAckTimedOut] = useState(false);
  const { vehicles, fetchVehicles } = useAccountStore();
  const {
    scanQrResponse,
    setChargingData,
    setIsCharging,
    startSession,
  } = useSessionStore();
  const [startAckSessionId, setStartAckSessionId] = useState<string | null>(null);

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

      setPlugStatusText(`Estado conector: ${res.connector.statusOcpp}`);
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

  useEffect(() => {
    if (lastUpdate && lastUpdate.type === 'session-update') {
      if (isAwaitingStartAck && lastUpdate.data.status === 'FAILED') {
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
  }, [lastUpdate, setChargingData, setIsCharging, navigation]);

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
      if (status.ready && status.sessionId) {
        setStartAckSessionId(status.sessionId);
      } else if (status.status === 'FAILED') {
        setStartAckError(status.message || 'No se pudo iniciar la sesión de carga.');
        setIsAwaitingStartAck(false);
      }
    }, 18000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isAwaitingStartAck, scanQrResponse?.correlationId]);

  useEffect(() => {
    if (wsError) {
      Alert.alert('Error de conexión', wsError);
    }
  }, [wsError]);

  const connectorInfoProps = useMemo(() => {
    const conn = lastPlugStatus?.connector;
    if (!conn) {
      return { connectorType: undefined, price: undefined, powerKw: undefined };
    }
    return {
      connectorType: conn.connectorType ?? undefined,
      price:
        conn.price != null ? `$${conn.price} / kWh` : undefined,
      powerKw: conn.powerKw != null ? `${conn.powerKw} kW` : undefined,
    };
  }, [lastPlugStatus]);

  const selectedVehicle: Car | null =
    selectedVehicleIndex != null && vehicles[selectedVehicleIndex]
      ? vehicles[selectedVehicleIndex]
      : null;

  const handleStartSession = async () => {
    if (selectedVehicleIndex == null) {
      Alert.alert('Error', 'Selecciona un vehículo');
      return;
    }
    if (!isPlugReady) {
      Alert.alert(
        'Error',
        'Espera a que el vehículo esté conectado (Preparing)',
      );
      return;
    }
    if (!scanQrResponse) {
      Alert.alert('Error', 'Sesión no inicializada');
      return;
    }

    const vehicle = vehicles[selectedVehicleIndex];
    if (!vehicle) {
      Alert.alert('Error', 'Vehículo no válido');
      return;
    }

    setIsSubmitting(true);
    try {
      setStartAckError(null);
      setStartAckTimedOut(false);
      const init = Number(initialSocPercent) || 0;
      const target = mode === 'FULL' ? 100 : Number(targetSocPercent) || 80;

      let chargeProfileToSend: ChargeProfile | undefined;

      // En "Carga completa" queremos que el backend cargue sin límite de energía fijado
      // desde la app (solo dependerá del vehículo / CSMS), así que no enviamos chargeProfile.
      if (chargeSection !== 'FULL') {
        const chargeProfile: ChargeProfile = {};

        const today = new Date();
        today.setHours(
          departureTime.ampm === 'PM' && departureTime.hour !== 12
            ? departureTime.hour + 12
            : departureTime.ampm === 'AM' && departureTime.hour === 12
              ? 0
              : departureTime.hour,
          departureTime.minute,
          0,
          0,
        );
        chargeProfile.departureTime = today.toISOString();

        const pricePerKwhNum = lastPlugStatus?.connector?.price ?? 0;

        // Enviar potencia máxima solo si es válida (evita 400 por NaN / negativos)
        const connectorPower = toFiniteNumber(lastPlugStatus?.connector?.powerKw);
        if (connectorPower != null && connectorPower >= 0) {
          chargeProfile.maxPowerKw = connectorPower;
        }

        if (chargeSection === 'CLP' && amountClp && pricePerKwhNum > 0) {
          const clp = parseInt(amountClp.replace(/\D/g, ''), 10);
          if (Number.isFinite(clp)) {
            const energy = clp / pricePerKwhNum;
            if (Number.isFinite(energy) && energy >= 0) {
              chargeProfile.targetEnergy = energy;
            }
          }
        }
        if (chargeSection === 'ENERGY' && energyKw) {
          const energy = toFiniteNumber(energyKw);
          if (energy != null && energy > 0) {
            chargeProfile.targetEnergy = energy;
          }
        }

        if (Object.keys(chargeProfile).length > 0) {
          chargeProfileToSend = chargeProfile;
        }
      }

      const response = await startSession({
        correlationId: scanQrResponse.correlationId,
        vehicleId: vehicle.id,
        // Si el usuario elige "Carga total", el backend espera mode=FULL (targetSocPercent se fuerza a 100).
        mode: chargeSection === 'FULL' ? 'FULL' : mode,
        initialSocPercent: init,
        targetSocPercent: chargeSection === 'FULL' ? undefined : target,
        chargeProfile: chargeProfileToSend,
      });

      if (response?.success) {
        setIsAwaitingStartAck(true);
        // El WS se conectará cuando tengamos `sessionId` (vía session-update o checkSessionStatus).
        setStartAckSessionId(null);
      } else {
        Alert.alert('Error', 'No se pudo iniciar la carga');
      }
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    useSessionStore.getState().clearSession();
    replaceToRoute('App');
  };

  const pricePerKwh = lastPlugStatus?.connector?.price ?? 0;
  const tariffText =
    pricePerKwh > 0 ? `Tarifa: $${pricePerKwh} / kWh` : 'Tarifa: —';
  const totalEstimate =
    chargeSection === 'CLP' && amountClp
      ? `Total estimado: $${amountClp}`
      : chargeSection === 'ENERGY' && energyKw
        ? `Total estimado: ~$${Math.round(parseFloat(energyKw || '0') * pricePerKwh)}`
        : chargeSection === 'FULL'
          ? 'Carga completa'
          : 'Total estimado: —';

  if (!isPlugReady) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Layout style={styles.centeredBlock}>
          <Text category="h5" style={styles.blockTitle}>
            Conecta el cargador a tu automóvil
          </Text>
          <Text category="s1" appearance="hint" style={styles.blockSubtitle}>
            {plugStatusText}
          </Text>
          <Button
            appearance="outline"
            status="danger"
            onPress={handleGoBack}
            style={styles.secondaryButton}
          >
            Volver
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  if (isAwaitingStartAck) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Layout style={styles.centeredBlock}>
          <Spinner size="giant" />
          <Text category="s1" style={styles.blockTitle}>
            Preparando tu sesión de carga...
          </Text>
          <Text category="s2" appearance="hint" style={styles.blockSubtitle}>
            {startAckTimedOut
              ? 'Está tardando más de lo normal. Revisa el estado y vuelve a intentar.'
              : 'Esto puede tomar unos segundos mientras confirmamos la sesión.'}
          </Text>
          {startAckTimedOut ? (
            <Button
              status="primary"
              onPress={async () => {
                const correlationId = scanQrResponse?.correlationId;
                if (!correlationId) return;
                setStartAckTimedOut(false);
                const status = await checkSessionStatus(correlationId);
                if (!status) {
                  Alert.alert('Error', 'No se pudo verificar el estado de la sesión.');
                  return;
                }
                if (status.ready && status.sessionId) {
                  // Esto hará que el hook conecte al WS y haga join automáticamente.
                  setStartAckSessionId(status.sessionId);
                } else if (status.status === 'FAILED') {
                  setStartAckError(status.message || 'No se pudo iniciar la sesión de carga.');
                  setIsAwaitingStartAck(false);
                } else {
                  setStartAckTimedOut(true);
                }
              }}
              style={styles.primaryButton}
            >
              Reintentar
            </Button>
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
      </SafeAreaView>
    );
  }

  if (startAckError) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Layout style={styles.centeredBlock}>
          <Text category="h6" style={styles.blockTitle}>
            No se pudo iniciar la sesión
          </Text>
          <Text category="s2" appearance="hint" style={styles.blockSubtitle}>
            {startAckError}
          </Text>
          <Button
            status="primary"
            onPress={() => {
              setStartAckError(null);
              setIsAwaitingStartAck(false);
            }}
            style={styles.primaryButton}
          >
            Volver
          </Button>
        </Layout>
      </SafeAreaView>
    );
  }

  const stepTitles: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
    1: {
      title: 'Seleccionar Vehículo',
      subtitle: 'Selecciona tu vehículo a cargar',
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
    { id: 'ENERGY' as const, label: 'Energía (kW)' },
    { id: 'FULL' as const, label: 'Carga total' },
  ];

  const formatClp = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '$0';
    const withDots = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${withDots}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.stepContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepInner}>
            {(step === 1 || step === 2) && (
              <ConnectorInfo {...connectorInfoProps} />
            )}
            <HeaderFlow
              title={stepTitles[step].title}
              subtitle={stepTitles[step].subtitle}
              onBack={
                step > 1 ? () => setStep((s) => (s - 1) as 1 | 2 | 3) : undefined
              }
            />
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

            {step === 2 && (
              <TimePickerColumns value={departureTime} onChange={setDepartureTime} />
            )}

            {step === 3 && selectedVehicle && (
              <>
                <PreparingSessionCard
                  vehicle={selectedVehicle}
                  chargePointName={scanQrResponse?.chargePoint?.ocppId ?? '—'}
                  connectorName={
                    lastPlugStatus?.connector?.connectorType ??
                    (scanQrResponse as any)?.connector?.connectorType ??
                    '—'
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
                  <View style={styles.sectionContent}>
                    <MetaCharge value={formatClp(amountClp)} />
                    <Input
                      value={isAmountFocused ? manualAmount : ''}
                      onChangeText={(text) => {
                        setManualAmount(text);
                        const digits = text.replace(/\D/g, '');
                        setAmountClp(digits);
                      }}
                      placeholder="Ingrese el monto"
                      keyboardType="numeric"
                      style={[styles.input, styles.amountInput]}
                      onFocus={() => {
                        setIsAmountFocused(true);
                        setManualAmount(amountClp);
                      }}
                      onBlur={() => {
                        setIsAmountFocused(false);
                      }}
                    />
                    <View style={styles.quickAmounts}>
                      {QUICK_AMOUNTS.map((amt) => (
                        <Button
                          key={amt}
                          size="small"
                          status={amountClp === String(amt) ? 'primary' : 'basic'}
                          onPress={() => setAmountClp(String(amt))}
                          style={styles.quickAmountBtn}
                        >
                          ${(amt / 1000).toFixed(0)}k
                        </Button>
                      ))}
                    </View>
                  </View>
                )}
                {chargeSection === 'ENERGY' && (
                  <View style={styles.sectionContent}>
                    <MetaCharge value={`${energyKw || '0'} kW`} />
                    <Input
                      value={energyKw}
                      onChangeText={setEnergyKw}
                      placeholder="Energía (kW)"
                      keyboardType="decimal-pad"
                      style={[styles.input, styles.amountInput]}
                    />
                  </View>
                )}
                {chargeSection === 'FULL' && (
                  <View style={styles.sectionContent}>
                    <MetaCharge value="Carga completa" icon="energy" />
                  </View>
                )}
                {chargeSection === 'CLP' ? (
                  <Button
                    status="primary"
                    onPress={handleStartSession}
                    disabled={isSubmitting}
                    style={styles.primaryButton}
                  >
                    {isSubmitting ? 'Enviando...' : 'Iniciar carga'}
                  </Button>
                ) : (
                  <Layout style={styles.summaryCard}>
                    <Text
                      category="s2"
                      appearance="hint"
                      style={styles.summaryTotal}
                    >
                      {totalEstimate}
                    </Text>
                    <Button
                      status="primary"
                      onPress={handleStartSession}
                      disabled={isSubmitting}
                      style={styles.primaryButton}
                    >
                      {isSubmitting ? 'Enviando...' : 'Iniciar carga'}
                    </Button>
                  </Layout>
                )}
              </>
            )}

            <View style={styles.footer}>
              <View style={styles.dots}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      step >= i ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                ))}
              </View>
              {step === 1 && (
                <Button
                  status="primary"
                  onPress={() => setStep(2)}
                  disabled={selectedVehicleIndex == null}
                  style={styles.stepButton}
                >
                  Siguiente
                </Button>
              )}
              {step === 2 && (
                <Button
                  status="primary"
                  onPress={() => setStep(3)}
                  style={styles.stepButton}
                >
                  Confirmar Salida
                </Button>
              )}

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  blockSubtitle: { textAlign: 'center', marginBottom: 28 },
  stepContent: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepInner: {
    width: '100%',
    gap: 24,
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
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  quickAmountBtn: { minWidth: 60 },
  input: { width: '100%' },
  amountInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlign: 'center',
    fontWeight: '700',
  },
  summaryCard: {
    width: '100%',
    marginTop: 20,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FBFCFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1.5,
    elevation: 1,
  },
  summaryTotal: {
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
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
  dotActive: { backgroundColor: '#44B778' },
  dotInactive: { backgroundColor: '#C5CEE0' },
  stepButton: { width: '100%' },
});
