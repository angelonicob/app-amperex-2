import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Layout, Text } from '@ui-kitten/components';
import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exitCreateReservationFlow } from '../../../../modules/reservation/createReservationFlow';
import { getDeviceTimezone } from '../../../../modules/reservation/reservationApi';
import { parseReservationApiError } from '../../../../modules/reservation/reservationApiErrors';
import { useReservationStore } from '../../../../modules/reservation/store/useReservationStore';
import { useUserStore } from '../../../../modules/user/store/useUserStore';
import { ReservationDayCalendar } from '../../../../shared/components/reservation/ReservationDayCalendar';
import { ButtonPrimary } from '../../../../shared/components/ui/button/ButtonPrimary';
import { useInfoDialog } from '../../../../shared/hooks/useInfoDialog';
import { useSystemChrome } from '../../../../shared/hooks/useSystemChrome';
import { useAppTheme } from '../../../../shared/theme/useAppTheme';
import {
  formatReservationDraftSummary,
  minutes24ToLocalIso,
  type ReservationWindowMinutes,
  validateReservationWindow,
} from '../../../../shared/utils/connectorSchedule';
import { navigateToSessionCompletion } from '../../../../shared/utils/navigateToSessionCompletion';
import type { RootStackParams } from '../../../routes/navigationParams';
import { CreateReservationHeader } from './CreateReservationHeader';

type Route = RouteProp<RootStackParams, 'CreateReserva'>;

export function CreateReservationAgendaScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const screenBackground = useSystemChrome();
  const colors = useAppTheme();
  const { showInfo, InfoDialog } = useInfoDialog();
  const currentUserId = useUserStore((s) => s.user?.id);
  const agenda = useReservationStore((s) => s.agenda);
  const { createReservation } = useReservationStore();

  const [draftWindow, setDraftWindow] = useState<ReservationWindowMinutes | null>(null);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { stationId, stationName, chargePointConnectorId, connectorLabel } =
    route.params;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      useReservationStore.getState().clearAgenda();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAgendaError = useCallback(
    (error: unknown) => {
      const parsed = parseReservationApiError(error);
      if (parsed.kind === 'payment_required' && parsed.pendingSessionId) {
        showInfo('Pago pendiente', parsed.message, {
          onAfterAccept: () => {
            exitCreateReservationFlow();
            void navigateToSessionCompletion(parsed.pendingSessionId!);
          },
        });
        return;
      }
      if (parsed.kind === 'forbidden') {
        showInfo('Acceso denegado', parsed.message, {
          onAfterAccept: exitCreateReservationFlow,
        });
        return;
      }
      showInfo('Error', parsed.message);
    },
    [showInfo],
  );

  const handleConfirm = async () => {
    if (!draftWindow || !agenda || !dateKey) {
      showInfo('Horario', 'Tocá un horario libre en la agenda.');
      return;
    }

    const err = validateReservationWindow(agenda, draftWindow, {
      dateKey,
      currentUserId,
    });
    if (err) {
      showInfo('Horario inválido', err);
      return;
    }

    const startAtLocal = minutes24ToLocalIso(dateKey, draftWindow.startMinutes24);
    const endAtLocal = minutes24ToLocalIso(dateKey, draftWindow.endMinutes24);

    setSubmitting(true);
    try {
      await createReservation({
        stationId,
        chargePointConnectorId,
        startAtLocal,
        endAtLocal,
        timezone: getDeviceTimezone(),
      });
      showInfo('Reserva creada', 'Tu reserva se registró correctamente.', {
        onAfterAccept: exitCreateReservationFlow,
      });
    } catch (e: unknown) {
      const parsed = parseReservationApiError(e);
      if (parsed.kind === 'payment_required' && parsed.pendingSessionId) {
        showInfo('Pago pendiente', parsed.message, {
          onAfterAccept: () => {
            exitCreateReservationFlow();
            void navigateToSessionCompletion(parsed.pendingSessionId!);
          },
        });
        return;
      }
      if (parsed.kind === 'forbidden') {
        showInfo('Acceso denegado', parsed.message, {
          onAfterAccept: exitCreateReservationFlow,
        });
        return;
      }
      const status = isAxiosError(e) ? e.response?.status : undefined;
      if (status === 409) {
        showInfo('Horario no disponible', parsed.message);
      } else {
        showInfo('Error', parsed.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm = Boolean(draftWindow && agenda && dateKey && !submitting);

  const stationHoursSubtitle = useMemo(() => {
    if (!agenda) return undefined;
    const openAt = agenda.station.openAt ?? '00:00';
    const closeAt = agenda.station.closeAt ?? '23:59';
    return `Horario de estación: ${openAt} – ${closeAt}`;
  }, [agenda]);

  const reservationSummary = useMemo(() => {
    if (!draftWindow || !dateKey) return null;
    return formatReservationDraftSummary(dateKey, draftWindow);
  }, [dateKey, draftWindow]);

  return (
    <SafeAreaView
      style={[styles.flex1, { backgroundColor: screenBackground }]}
      edges={['top', 'bottom']}
    >
      <Layout level="1" style={styles.flex1}>
        {InfoDialog}
        <CreateReservationHeader
          title="Elige tu horario"
          stationName={stationName}
          connectorLabel={connectorLabel}
          subtitle={stationHoursSubtitle}
        />
        <ReservationDayCalendar
          connectorId={chargePointConnectorId}
          currentUserId={currentUserId}
          onDraftWindowChange={setDraftWindow}
          onDateKeyChange={setDateKey}
          onLoadError={handleAgendaError}
        />

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {reservationSummary ? (
            <View style={styles.reservationSummary}>
              <Text category="c1" style={{ color: colors.textSecondary }}>
                Tu reserva
              </Text>
              <Text
                category="s1"
                style={[styles.reservationSummaryValue, { color: colors.text }]}
              >
                {reservationSummary}
              </Text>
            </View>
          ) : null}
          <ButtonPrimary
            title={submitting ? 'Reservando…' : 'Confirmar reserva'}
            onPress={() => void handleConfirm()}
            disabled={!canConfirm}
            style={styles.confirmBtn}
          />
        </View>
      </Layout>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  reservationSummary: {
    gap: 2,
  },
  reservationSummaryValue: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  confirmBtn: { marginTop: 0 },
});
