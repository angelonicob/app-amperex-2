import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Layout, Text } from '@ui-kitten/components';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useReservationStore } from '../../../modules/reservation/store/useReservationStore';
import { useReservationConfirmStore } from '../../../modules/reservation/store/useReservationConfirmStore';
import type { UserReservation } from '../../../modules/reservation/types';
import {
  ButtonPrimary,
  ButtonTransparent,
} from '../../../shared/components/ui/button';
import Icon from '../../../shared/components/icons/Icon';
import { EmptyStateLayout } from '../../../shared/components/layout/EmptyStateLayout';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog';
import { useInfoDialog } from '../../../shared/hooks/useInfoDialog';
import type { DrawerHomeParams } from '../../routes/navigationParams';
import { formatConnectorCode } from '../../../shared/utils/connectorDisplay';
import type { ReservationConnectorInfo } from '../../../modules/reservation/types';

function connectorCodeLabel(connector: ReservationConnectorInfo): string {
  return formatConnectorCode(connector.connectorType, connector.connectorId);
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

function formatRange(r: UserReservation): string {
  const start = new Date(r.startAt);
  const end = new Date(r.endAt);
  const date = start.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const t0 = start.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const t1 = end.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} · ${t0} – ${t1}`;
}

export const MyReservasScreen = () => {
  const colors = useAppTheme();
  const navigation = useNavigation<DrawerNavigationProp<DrawerHomeParams>>();
  const { activeReservation, history, loadingList, loadReservations, cancelActiveOrId } =
    useReservationStore();
  const [cancelling, setCancelling] = useState(false);
  const { showInfo, InfoDialog } = useInfoDialog();
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  const openConfirmModal = useReservationConfirmStore((s) => s.openReservationId);

  useFocusEffect(
    useCallback(() => {
      void loadReservations();
    }, [loadReservations]),
  );

  const handleOpenOnMap = useCallback(
    (stationId: string) => {
      navigation.navigate('Home', {
        screen: 'Mapa',
        params: { stationId },
      });
    },
    [navigation],
  );

  const handleCancel = (id: string) => {
    showConfirm({
      title: 'Cancelar reserva',
      message: 'Al cancelar esta reserva, perderás tu reserva y no podrás recuperarla. ¿Estás seguro?',
      labelConfirm: 'Si, cancelar',
      labelCancel: 'Volver',
      confirmDestructive: true,
      onConfirm: async () => {
        setCancelling(true);
        try {
          await cancelActiveOrId(id);
        } catch {
          showInfo('Error', 'No se pudo cancelar la reserva');
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  if (loadingList && !activeReservation && history.length === 0) {
    return (
      <Layout level="1" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        {InfoDialog}
      </Layout>
    );
  }

  const hasAny = activeReservation != null || history.length > 0;

  return (
    <Layout level="1" style={styles.container}>
      {InfoDialog}
      {ConfirmDialog}
      {!hasAny ? (
        <EmptyStateLayout
          title="No tienes reservas"
          subtitle="Cuando reserves un conector, aparecerá aquí."
          icon={{ name: 'calendar-check', iconStyle: 'solid' }}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeReservation ? (
            <Layout
              level="2"
              style={[
                styles.card,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.isDark
                    ? colors.backgroundTertiary
                    : colors.backgroundSecondary,
                },
              ]}
            >
              <Text category="label" style={{ color: colors.primary }}>
                Reserva activa
              </Text>
              <View style={styles.stationRow}>
                <Text
                  category="s1"
                  style={[styles.cardTitle, styles.stationName, { color: colors.text }]}
                >
                  {activeReservation.station.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver estación en el mapa"
                  onPress={() => handleOpenOnMap(activeReservation.station.id)}
                  style={({ pressed }) => [
                    styles.mapNavBtn,
                    {
                      backgroundColor: colors.isDark
                        ? 'rgba(68, 183, 120, 0.15)'
                        : 'rgba(68, 183, 120, 0.12)',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Icon name="map-location-dot" size={22} color={colors.primary} iconStyle="solid" />
                </Pressable>
              </View>
              {activeReservation.connector ? (
                <Text category="p2" style={{ color: colors.textSecondary }}>
                  {activeReservation.connector.chargePointName ?? 'Punto de carga'} ·{' '}
                  {connectorCodeLabel(activeReservation.connector)}
                </Text>
              ) : null}
              <Text category="s2" style={{ color: colors.text, marginTop: 8 }}>
                {formatRange(activeReservation)}
              </Text>
              {!activeReservation.confirmedAt ? (
                <ButtonPrimary
                  title="Confirmar asistencia"
                  onPress={() => openConfirmModal(activeReservation.id)}
                  style={styles.confirmBtn}
                />
              ) : (
                <Text category="c1" style={{ color: colors.textSecondary, marginTop: 12 }}>
                  Asistencia confirmada · {activeReservation.waitMinutes ?? 15} min de
                  espera al conectar
                </Text>
              )}
              <ButtonTransparent
                title={cancelling ? 'Cancelando…' : 'Cancelar reserva'}
                onPress={() => handleCancel(activeReservation.id)}
                disabled={cancelling}
                color={colors.danger}
                style={styles.cancelBtn}
              />
            </Layout>
          ) : null}

          {history.map((r) => (
            <Layout key={r.id} level="2" style={[styles.card, { borderColor: colors.border }]}>
              <Text category="c1" style={{ color: colors.textSecondary }}>
                {STATUS_LABELS[r.effectiveStatus] ?? r.effectiveStatus}
              </Text>
              <View style={styles.stationRow}>
                <Text
                  category="s1"
                  style={[styles.cardTitle, styles.stationName, { color: colors.text }]}
                >
                  {r.station.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver estación en el mapa"
                  onPress={() => handleOpenOnMap(r.station.id)}
                  style={({ pressed }) => [
                    styles.mapNavBtn,
                    {
                      backgroundColor: colors.isDark
                        ? 'rgba(255,255,255,0.06)'
                        : colors.backgroundTertiary,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Icon name="map-location-dot" size={22} color={colors.primary} iconStyle="solid" />
                </Pressable>
              </View>
              {r.connector ? (
                <Text category="p2" style={{ color: colors.textSecondary }}>
                  {r.connector.chargePointName} · {connectorCodeLabel(r.connector)}
                </Text>
              ) : null}
              <Text category="s2" style={{ color: colors.text, marginTop: 8 }}>
                {formatRange(r)}
              </Text>
            </Layout>
          ))}
        </ScrollView>
      )}
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cardTitle: { fontWeight: '700' },
  stationName: { flex: 1 },
  mapNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelBtn: {
    marginTop: 8,
    width: '100%',
  },
});
