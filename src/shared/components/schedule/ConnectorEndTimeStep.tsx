import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Text } from "@ui-kitten/components";
import { FontAwesome6 } from "@expo/vector-icons";
import { useReservationStore } from "../../../modules/reservation/store/useReservationStore";
import type { ProgrammedReservationScan } from "../../../modules/session/scanQr";
import { useAppTheme } from "../../theme/useAppTheme";
import {
  TimePickerColumns,
  type TimePickerColumnsValue,
} from "../session/TimePickerColumns";
import {
  buildEndTimeScheduleContext,
  clampEndTime,
  formatEndTimeMaxAvailableLabel,
  formatLimitHintMessage,
  getEndTimeBounds,
  isEndTimePickerOptionValid,
  isEndTimePickerValueValid,
  resolveEndTimeForStep,
  type ScheduleMode,
} from "../../utils/connectorSchedule";

export interface ConnectorEndTimeStepProps {
  mode: ScheduleMode;
  connectorId: string;
  dateKey: string;
  stationName?: string;
  connectorLabel?: string;
  connectorType?: string;
  fixedStartAtUtc?: string;
  programmedReservation?: ProgrammedReservationScan | null;
  currentUserId?: string | null;
  value: TimePickerColumnsValue | null;
  onChange: (value: TimePickerColumnsValue) => void;
  onValidityChange?: (valid: boolean) => void;
  /** Etiqueta del inicio fijo (solo reserva). */
  fixedStartLabel?: string;
}

export function ConnectorEndTimeStep({
  mode,
  connectorId,
  dateKey,
  stationName,
  connectorLabel,
  connectorType,
  fixedStartAtUtc,
  programmedReservation,
  currentUserId,
  value,
  onChange,
  onValidityChange,
  fixedStartLabel,
}: ConnectorEndTimeStepProps) {
  const colors = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const hoursBandMaxHeight = Math.max(128, Math.min(Math.round(windowHeight * 0.34), 220));
  const agenda = useReservationStore((s) => s.agenda);
  const loadingAgenda = useReservationStore((s) => s.loadingAgenda);
  const loadAgenda = useReservationStore((s) => s.loadAgenda);
  const [scheduleTick, setScheduleTick] = useState(0);

  useEffect(() => {
    void loadAgenda(connectorId, dateKey);
  }, [connectorId, dateKey, loadAgenda]);

  useEffect(() => {
    if (mode !== "session") return;
    const id = setInterval(() => setScheduleTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [mode]);

  const scheduleContext = useMemo(() => {
    if (!agenda) return null;
    return buildEndTimeScheduleContext(agenda, {
      mode,
      dateKey,
      fixedStartAtUtc,
      programmedReservation,
      now: new Date(),
    });
  }, [
    agenda,
    mode,
    dateKey,
    fixedStartAtUtc,
    programmedReservation,
    scheduleTick,
  ]);

  const boundsResult = useMemo(() => {
    if (!scheduleContext) return null;
    return getEndTimeBounds(scheduleContext, currentUserId);
  }, [scheduleContext, currentUserId]);

  /**
   * Primitivos para evitar que `pickerBounds` se recree cada 60s (por scheduleTick)
   * cuando los valores numéricos no cambiaron, lo que disparaba efectos en cascada
   * y hacía que el picker "saltara" inesperadamente.
   */
  const minMinutes24 = boundsResult?.minMinutes24 ?? null;
  const maxMinutes24 = boundsResult?.maxMinutes24 ?? null;

  const pickerBounds = useMemo(() => {
    if (minMinutes24 == null || maxMinutes24 == null) return undefined;
    return { minMinutes24, maxMinutes24 };
  }, [minMinutes24, maxMinutes24]);

  const isOptionValid = useCallback(
    (hour: number, minute: number, ampm: "AM" | "PM") => {
      if (!scheduleContext || !pickerBounds) return true;
      return isEndTimePickerOptionValid(
        hour,
        minute,
        ampm,
        scheduleContext,
        pickerBounds,
        currentUserId,
      );
    },
    [scheduleContext, pickerBounds, currentUserId],
  );

  const handleChange = useCallback(
    (next: TimePickerColumnsValue) => {
      if (!scheduleContext || !pickerBounds) {
        onChange(next);
        return;
      }
      onChange(
        clampEndTime(next, scheduleContext, pickerBounds, currentUserId),
      );
    },
    [onChange, scheduleContext, pickerBounds, currentUserId],
  );

  const valid = useMemo(() => {
    if (!value || !scheduleContext || !pickerBounds) return false;
    return isEndTimePickerValueValid(
      value,
      scheduleContext,
      pickerBounds,
      currentUserId,
    );
  }, [value, scheduleContext, pickerBounds, currentUserId]);

  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  useEffect(() => {
    if (!scheduleContext || !pickerBounds) return;
    if (value == null) {
      onChange(resolveEndTimeForStep(null, scheduleContext, currentUserId));
      return;
    }
    if (
      !isEndTimePickerValueValid(
        value,
        scheduleContext,
        pickerBounds,
        currentUserId,
      )
    ) {
      onChange(resolveEndTimeForStep(value, scheduleContext, currentUserId));
    }
  }, [scheduleContext, pickerBounds, currentUserId, value, onChange]);

  const limitMessage = useMemo(() => {
    if (!boundsResult || !scheduleContext) return null;
    return formatLimitHintMessage(boundsResult, scheduleContext.graceMinutes);
  }, [boundsResult, scheduleContext]);

  const programmedWindowLabel = useMemo(() => {
    if (
      !programmedReservation?.startAtLocal ||
      !programmedReservation?.endAtLocal
    ) {
      return null;
    }
    return `${programmedReservation.startAtLocal.slice(11, 16)} – ${programmedReservation.endAtLocal.slice(11, 16)}`;
  }, [programmedReservation?.startAtLocal, programmedReservation?.endAtLocal]);

  if (loadingAgenda && !agenda) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text category="c1" appearance="hint" style={styles.loadingText}>
          Cargando horarios…
        </Text>
      </View>
    );
  }

  if (!agenda || !scheduleContext || !boundsResult || !pickerBounds) {
    return (
      <View style={styles.loading}>
        <Text category="s1" style={{ color: colors.danger }}>
          No se pudieron cargar los horarios del conector.
        </Text>
        <Pressable onPress={() => void loadAgenda(connectorId, dateKey)}>
          <Text category="s1" style={{ color: colors.primary, marginTop: 8 }}>
            Reintentar
          </Text>
        </Pressable>
      </View>
    );
  }

  const maxDepartureLabel = formatEndTimeMaxAvailableLabel(boundsResult);
  const hasSlots = boundsResult.minMinutes24 <= boundsResult.maxMinutes24;

  return (
    <View style={styles.root}>
      <View
        style={[styles.hoursBandContainer, { maxHeight: hoursBandMaxHeight }]}
      >
        <ScrollView
          style={[styles.hoursBandScroll, { maxHeight: hoursBandMaxHeight }]}
          contentContainerStyle={[
            styles.hoursBand,
            { backgroundColor: colors.backgroundTertiary },
          ]}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
        {stationName || connectorType || connectorLabel ? (
          <View style={styles.stationRow}>
            {stationName ? (
              <Text
                category="s1"
                numberOfLines={1}
                style={[styles.bandTitle, styles.stationName, { color: colors.text }]}
              >
                {stationName}
              </Text>
            ) : null}
            {connectorType || connectorLabel ? (
              <Text
                category="s1"
                numberOfLines={1}
                style={[styles.connectorType, { color: colors.primary }]}
              >
                {connectorType ?? connectorLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Text style={styles.scheduleLine}>
          <Text style={[styles.scheduleLabel, { color: colors.textSecondary }]}>
            Horario de la estación:{" "}
          </Text>
          <Text style={[styles.scheduleValue, { color: colors.text }]}>
            {scheduleContext.stationWindow.openAt} –{" "}
            {scheduleContext.stationWindow.closeAt}
          </Text>
        </Text>
        <Text style={styles.scheduleLine}>
          <Text style={[styles.scheduleLabel, { color: colors.textSecondary }]}>
            Hora máxima de salida:{" "}
          </Text>
          <Text style={[styles.scheduleHighlight, { color: colors.primary }]}>
            {maxDepartureLabel}
          </Text>
        </Text>
        <View
          style={[
            styles.graceNotice,
            {
              backgroundColor: colors.isDark
                ? "rgba(255, 170, 0, 0.14)"
                : "rgba(255, 170, 0, 0.12)",
            },
          ]}
        >
          <FontAwesome6
            name="circle-info"
            size={14}
            color={colors.warning}
            iconStyle="solid"
            style={styles.graceNoticeIcon}
          />
          <Text
            category="c1"
            style={[
              styles.graceNoticeText,
              { color: colors.isDark ? "#E6B84D" : "#92600A" },
            ]}
          >
            Tendrás {scheduleContext.graceMinutes} min para retirar el vehículo,
            una vez termine la sesión de carga.
          </Text>
        </View>
        {fixedStartLabel ? (
          <Text category="c1" style={{ color: colors.text, marginTop: 4 }}>
            Inicio: {fixedStartLabel}
          </Text>
        ) : null}
        {programmedWindowLabel ? (
          <Text
            category="c1"
            style={{ color: colors.textSecondary, marginTop: 4 }}
          >
            Ventana de tu reserva: {programmedWindowLabel}
          </Text>
        ) : null}
        </ScrollView>
      </View>

      <View style={styles.pickerArea}>
        {limitMessage ? (
          <Text
            category="c1"
            style={[styles.limitHint, { color: colors.textSecondary }]}
          >
            {limitMessage}
          </Text>
        ) : null}

        <View style={styles.pickerSlot}>
          {hasSlots && value != null ? (
            <TimePickerColumns
              value={value}
              onChange={handleChange}
              bounds={pickerBounds}
              isOptionValid={isOptionValid}
            />
          ) : null}

          {!hasSlots ? (
            <Text category="c1" style={[styles.error, { color: colors.danger }]}>
              No hay horarios de salida válidos. La estación cierra a las{" "}
              {scheduleContext.stationWindow.closeAt}.
            </Text>
          ) : null}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: colors.text }]} />
            <Text category="c1" style={{ color: colors.textSecondary }}>
              Disponible
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.swatch, { backgroundColor: colors.textDisabled }]}
            />
            <Text category="c1" style={{ color: colors.textSecondary }}>
              No disponible
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flex: 1,
    minHeight: 0,
  },
  hoursBandContainer: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 0,
    overflow: "hidden",
  },
  hoursBandScroll: {
    width: "100%",
  },
  pickerArea: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    paddingTop: 12,
    gap: 8,
  },
  pickerSlot: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    marginTop: 8,
  },
  hoursBand: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  stationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bandTitle: {
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 22,
  },
  stationName: {
    flex: 1,
    minWidth: 0,
  },
  connectorType: {
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 0,
  },
  scheduleLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  scheduleLabel: {
    fontWeight: "500",
  },
  scheduleValue: {
    fontWeight: "600",
  },
  scheduleHighlight: {
    fontWeight: "700",
  },
  graceNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  graceNoticeIcon: {
    marginTop: 1,
  },
  graceNoticeText: {
    flex: 1,
    lineHeight: 18,
  },
  limitHint: {
    textAlign: "center",
    paddingHorizontal: 8,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    flexShrink: 0,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  error: {
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
