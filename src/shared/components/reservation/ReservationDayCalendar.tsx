import {
  CalendarBody,
  CalendarContainer,
  DraggingEvent,
  type CalendarKitHandle,
  type DateOrDateTime,
  type PackedEvent,
  type SelectedEventType,
} from '@howljs/calendar-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  formatLocalDateKey,
  getDeviceTimezone,
} from '../../../modules/reservation/reservationApi';
import { useReservationStore } from '../../../modules/reservation/store/useReservationStore';
import {
  clampReservationWindow,
  DEFAULT_MIN_RESERVATION_MINUTES,
  formatReservationDayLabel,
  hasBookableReservationSlotsForDate,
  RESERVATION_DRAG_STEP_MINUTES,
  type ReservationWindowMinutes,
} from '../../utils/connectorSchedule';
import {
  buildUnavailableHoursByDate,
  calendarEventToWindowMinutes,
  mapOccupiedEvents,
  resolveEventLocalDateKey,
  windowFromTapDateTime,
  windowMinutesToSelectedEvent,
} from '../../utils/reservationCalendarMapper';
import { useAppTheme } from '../../theme/useAppTheme';
import Icon from '../icons/Icon';
import { AgendaSkeleton } from './AgendaSkeleton';

/** Tiempo mínimo visible del skeleton para evitar parpadeos en respuestas rápidas. */
const MIN_CALENDAR_SKELETON_MS = 360;

export interface ReservationDayCalendarProps {
  connectorId: string;
  currentUserId?: string | null;
  onDraftWindowChange: (window: ReservationWindowMinutes | null) => void;
  onDateKeyChange?: (dateKey: string) => void;
  onLoadError?: (error: unknown) => void;
}

export function ReservationDayCalendar({
  connectorId,
  currentUserId,
  onDraftWindowChange,
  onDateKeyChange,
  onLoadError,
}: ReservationDayCalendarProps) {
  const colors = useAppTheme();
  const calendarRef = useRef<CalendarKitHandle>(null);
  const { agenda, loadingAgenda, loadAgenda } = useReservationStore();
  const [dateKey, setDateKey] = useState(() => formatLocalDateKey(new Date()));
  const [draftWindow, setDraftWindow] = useState<ReservationWindowMinutes | null>(null);
  const [calendarMounted, setCalendarMounted] = useState(false);
  const [calendarLayoutReady, setCalendarLayoutReady] = useState(false);
  const [minSkeletonElapsed, setMinSkeletonElapsed] = useState(false);

  const todayKey = formatLocalDateKey(new Date());
  const timeZone = getDeviceTimezone();

  const slotMinutes =
    agenda?.minReservationMinutes ?? DEFAULT_MIN_RESERVATION_MINUTES;

  const applyDraftWindow = useCallback(
    (window: ReservationWindowMinutes | null) => {
      setDraftWindow(window);
      onDraftWindowChange(window);
    },
    [onDraftWindowChange],
  );

  const changeDateKey = useCallback(
    (next: string) => {
      if (next < todayKey) return;
      applyDraftWindow(null);
      setDateKey(next);
      calendarRef.current?.setVisibleDate(next);
    },
    [applyDraftWindow, todayKey],
  );

  useEffect(() => {
    void loadAgenda(connectorId, dateKey).catch((err) => {
      onLoadError?.(err);
    });
  }, [connectorId, dateKey, loadAgenda, onLoadError]);

  useEffect(() => {
    onDateKeyChange?.(dateKey);
  }, [dateKey, onDateKeyChange]);

  const goPrevDay = useCallback(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    changeDateKey(formatLocalDateKey(dt));
  }, [changeDateKey, dateKey]);

  const goNextDay = useCallback(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    changeDateKey(formatLocalDateKey(dt));
  }, [changeDateKey, dateKey]);

  const openMinutes =
    agenda?.date === dateKey ? (agenda.operatingHours.openMinutes ?? 0) : 0;
  const closeMinutes =
    agenda?.date === dateKey
      ? (agenda.operatingHours.closeMinutes ?? 24 * 60)
      : 24 * 60;

  const occupiedEvents = useMemo(() => {
    if (!agenda || agenda.date !== dateKey) return [];
    return mapOccupiedEvents(agenda, {
      dateKey,
      timeZone,
      currentUserId,
      isDark: colors.isDark,
    });
  }, [agenda, colors.isDark, currentUserId, dateKey, timeZone]);

  const unavailableHours = useMemo(() => {
    if (!agenda || agenda.date !== dateKey) return [];
    return buildUnavailableHoursByDate(agenda, dateKey, new Date());
  }, [agenda, dateKey]);

  const selectedEvent = useMemo(() => {
    if (!draftWindow || !agenda || agenda.date !== dateKey) return undefined;
    return windowMinutesToSelectedEvent(
      draftWindow,
      dateKey,
      timeZone,
      colors.primary,
    );
  }, [agenda, colors.primary, dateKey, draftWindow, timeZone]);

  const hasBookableSlots = useMemo(() => {
    if (!agenda || agenda.date !== dateKey) return false;
    return hasBookableReservationSlotsForDate(agenda, {
      dateKey,
      currentUserId,
      stepMinutes: slotMinutes,
    });
  }, [agenda, currentUserId, dateKey, slotMinutes]);

  const agendaReady = Boolean(
    agenda && agenda.date === dateKey && !loadingAgenda,
  );
  const showEmptyDay = agendaReady && !hasBookableSlots;
  const calendarContentReady =
    agendaReady && hasBookableSlots && calendarLayoutReady && minSkeletonElapsed;
  const calendarInteractive = calendarContentReady;
  const showCalendarSkeleton = !calendarContentReady;

  useEffect(() => {
    setCalendarMounted(false);
    setCalendarLayoutReady(false);
    setMinSkeletonElapsed(false);

    const timeoutId = setTimeout(() => {
      setMinSkeletonElapsed(true);
    }, MIN_CALENDAR_SKELETON_MS);

    return () => clearTimeout(timeoutId);
  }, [connectorId, dateKey]);

  useEffect(() => {
    if (!agendaReady) {
      setCalendarLayoutReady(false);
      return;
    }
    if (hasBookableSlots) {
      setCalendarMounted(true);
      return;
    }
    setCalendarMounted(false);
    setCalendarLayoutReady(false);
  }, [agendaReady, hasBookableSlots]);

  const handleCalendarLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!agendaReady || !hasBookableSlots) {
        return;
      }
      const { height, width } = event.nativeEvent.layout;
      if (height > 0 && width > 0) {
        setCalendarLayoutReady(true);
      }
    },
    [agendaReady, hasBookableSlots],
  );

  const selectWindow = useCallback(
    (raw: ReservationWindowMinutes) => {
      if (!agenda || agenda.date !== dateKey) return;
      const clamped = clampReservationWindow(agenda, raw, {
        dateKey,
        currentUserId,
        stepMinutes: RESERVATION_DRAG_STEP_MINUTES,
      });
      applyDraftWindow(clamped);
    },
    [agenda, applyDraftWindow, currentUserId, dateKey],
  );

  const handlePressBackground = useCallback(
    (props: DateOrDateTime) => {
      if (!calendarInteractive || !agenda || agenda.date !== dateKey) return;
      if (!('dateTime' in props) || !props.dateTime) return;

      const tapDateKey = resolveEventLocalDateKey({
        start: { dateTime: props.dateTime, timeZone },
      });
      if (!tapDateKey || tapDateKey < todayKey || tapDateKey !== dateKey) {
        return;
      }

      const raw = windowFromTapDateTime(props.dateTime, slotMinutes);
      selectWindow(raw);
    },
    [
      agenda,
      calendarInteractive,
      currentUserId,
      dateKey,
      selectWindow,
      slotMinutes,
      timeZone,
      todayKey,
    ],
  );

  const handleDragSelectedEventEnd = useCallback(
    (event: SelectedEventType) => {
      if (!event.start || !event.end || !agenda || agenda.date !== dateKey) {
        return;
      }
      const eventDateKey = resolveEventLocalDateKey({ start: event.start });
      if (!eventDateKey || eventDateKey !== dateKey) return;

      const raw = calendarEventToWindowMinutes(
        { start: event.start, end: event.end },
        dateKey,
      );
      if (!raw) return;
      selectWindow(raw);
    },
    [agenda, dateKey, selectWindow],
  );

  const renderDraggingEvent = useCallback(
    () => (
      <DraggingEvent
        containerStyle={{
          backgroundColor: colors.isDark
            ? 'rgba(68, 183, 120, 0.55)'
            : colors.primary,
          borderColor: colors.primary,
        }}
      />
    ),
    [colors.isDark, colors.primary],
  );

  const calendarTheme = useMemo(
    () => ({
      colors: {
        primary: colors.primary,
        onPrimary: colors.white,
        background: colors.background,
        onBackground: colors.text,
        border: colors.border,
        text: colors.text,
        surface: colors.backgroundTertiary,
        onSurface: colors.textSecondary,
      },
      hourTextStyle: { color: colors.textSecondary, fontSize: 11 },
      hourBorderColor: colors.border,
      nowIndicatorColor: '#1A73E8',
      unavailableHourBackgroundColor: colors.isDark
        ? 'rgba(136, 136, 136, 0.14)'
        : 'rgba(143, 155, 179, 0.18)',
      outOfRangeBackgroundColor: colors.backgroundTertiary,
      eventContainerStyle: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.isDark
          ? 'rgba(255, 255, 255, 0.22)'
          : 'rgba(0, 0, 0, 0.08)',
      },
      eventTitleStyle: {
        fontWeight: '700' as const,
        fontSize: 11,
      },
    }),
    [colors],
  );

  const renderOccupiedEvent = useCallback(
    (event: PackedEvent) => (
      <View style={styles.eventLabelWrap}>
        <Text
          style={[
            styles.eventLabel,
            { color: event.titleColor ?? colors.white },
          ]}
          numberOfLines={2}
        >
          {event.title}
        </Text>
      </View>
    ),
    [colors.white],
  );

  const legendItems = useMemo(
    () => [
      {
        key: 'draft',
        color: colors.primary,
        label: 'Tu selección',
      },
      {
        key: 'occupied',
        color: colors.isDark ? '#C9365A' : 'rgba(255, 61, 113, 0.72)',
        label: 'Ocupado',
      },
      {
        key: 'mine',
        color: colors.isDark ? '#2E8A57' : 'rgba(68, 183, 120, 0.72)',
        label: 'Tuyo',
      },
      {
        key: 'charging',
        color: colors.isDark ? '#B8860B' : 'rgba(255, 170, 0, 0.72)',
        label: 'En carga',
      },
      {
        key: 'unavailable',
        color: colors.isDark
          ? 'rgba(136, 136, 136, 0.35)'
          : 'rgba(143, 155, 179, 0.45)',
        label: 'No disponible',
      },
    ],
    [colors.isDark, colors.primary],
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.dayNav}>
          <Pressable
            onPress={goPrevDay}
            disabled={dateKey <= todayKey}
            android_ripple={{
              color: colors.border,
              borderless: false,
              radius: 18,
            }}
            style={({ pressed }) => [
              styles.dayBtn,
              dateKey <= todayKey
                ? styles.dayBtnDisabled
                : pressed
                  ? { backgroundColor: colors.backgroundTertiary }
                  : null,
            ]}
          >
            <Icon name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
          <Text style={[styles.dayLabel, { color: colors.text }]}>
            {formatReservationDayLabel(dateKey)}
          </Text>
          <Pressable
            onPress={goNextDay}
            android_ripple={{
              color: colors.border,
              borderless: false,
              radius: 18,
            }}
            style={({ pressed }) => [
              styles.dayBtn,
              pressed ? { backgroundColor: colors.backgroundTertiary } : null,
            ]}
          >
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {calendarInteractive && !draftWindow ? (
          <Text style={[styles.tapHint, { color: colors.textSecondary }]}>
            Tocá un horario libre para seleccionarlo. Ajustá inicio o fin con
            los puntos del bloque verde.
          </Text>
        ) : null}

        <View style={styles.legendRow}>
          {legendItems.map((item) => (
            <View key={item.key} style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  {
                    backgroundColor: item.color,
                    borderColor: colors.isDark
                      ? 'rgba(255,255,255,0.22)'
                      : 'rgba(0,0,0,0.1)',
                  },
                ]}
              />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {showEmptyDay ? (
        <View style={[styles.emptyDay, { backgroundColor: colors.background }]}>
          <Text style={[styles.emptyDayTitle, { color: colors.text }]}>
            No quedan horarios disponibles hoy
          </Text>
          
        </View>
      ) : (
        <View
          style={[styles.calendarSlot, { backgroundColor: colors.background }]}
        >
          {calendarMounted ? (
            <View style={styles.calendarWrap} onLayout={handleCalendarLayout}>
              <CalendarContainer
                key={dateKey}
                ref={calendarRef}
                numberOfDays={1}
                scrollByDay={false}
                initialDate={dateKey}
                minDate={todayKey}
                timeZone={timeZone}
                locale="es"
                initialLocales={{
                  es: {
                    weekDayShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
                    meridiem: { ante: 'a. m.', post: 'p. m.' },
                    more: '{count} más',
                  },
                }}
                start={openMinutes}
                end={closeMinutes}
                timeInterval={slotMinutes}
                initialTimeIntervalHeight={48}
                minTimeIntervalHeight={40}
                maxTimeIntervalHeight={72}
                dragStep={RESERVATION_DRAG_STEP_MINUTES}
                defaultDuration={slotMinutes}
                allowDragToCreate={false}
                allowDragToEdit={calendarInteractive}
                allowHorizontalSwipe={false}
                useHaptic
                useAllDayEvent={false}
                scrollToNow={false}
                isLoading={!agendaReady}
                theme={calendarTheme}
                events={occupiedEvents}
                unavailableHours={unavailableHours}
                selectedEvent={selectedEvent}
                onPressBackground={handlePressBackground}
                onDragSelectedEventEnd={handleDragSelectedEventEnd}
              >
                <CalendarBody
                  renderEvent={renderOccupiedEvent}
                  renderDraggingEvent={renderDraggingEvent}
                />
              </CalendarContainer>
            </View>
          ) : null}
          {showCalendarSkeleton ? (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.skeletonOverlay,
                { backgroundColor: colors.background },
              ]}
            >
              <AgendaSkeleton />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  dayNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBtnDisabled: {
    opacity: 0.35,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 11,
  },
  eventLabelWrap: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  eventLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  calendarSlot: {
    flex: 1,
    overflow: 'hidden',
  },
  calendarWrap: {
    flex: 1,
    paddingHorizontal: 8,
  },
  skeletonOverlay: {
    zIndex: 2,
  },
  emptyDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyDayTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDayHint: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
