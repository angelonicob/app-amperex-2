import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarKitHandle,
  type OnCreateEventResponse,
  type PackedEvent,
  type SelectedEventType,
} from '@howljs/calendar-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  formatLocalDateKey,
  getDeviceTimezone,
} from '../../../modules/reservation/reservationApi';
import { useReservationStore } from '../../../modules/reservation/store/useReservationStore';
import {
  clampReservationWindow,
  findFirstFreeReservationWindow,
  formatLimitHintMessage,
  formatReservationWindowLabel,
  getEndTimeBoundsForWindow,
  hasBookableReservationSlotsForDate,
  RESERVATION_DRAG_STEP_MINUTES,
  type ReservationWindowMinutes,
} from '../../utils/connectorSchedule';
import {
  buildUnavailableHoursByDate,
  calendarEventToWindowMinutes,
  mapOccupiedEvents,
  windowMinutesToSelectedEvent,
} from '../../utils/reservationCalendarMapper';
import { useAppTheme } from '../../theme/useAppTheme';
import Icon from '../icons/Icon';
import { AgendaSkeleton } from './AgendaSkeleton';

export interface ReservationDayCalendarProps {
  connectorId: string;
  currentUserId?: string | null;
  onDraftWindowChange: (window: ReservationWindowMinutes | null) => void;
  onDateKeyChange?: (dateKey: string) => void;
  onLoadError?: (error: unknown) => void;
}

function formatDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
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

  const todayKey = formatLocalDateKey(new Date());
  const timeZone = getDeviceTimezone();

  useEffect(() => {
    void loadAgenda(connectorId, dateKey).catch((err) => {
      onLoadError?.(err);
    });
  }, [connectorId, dateKey, loadAgenda, onLoadError]);

  useEffect(() => {
    onDateKeyChange?.(dateKey);
  }, [dateKey, onDateKeyChange]);

  useEffect(() => {
    if (!agenda || agenda.date !== dateKey) return;
    const free = findFirstFreeReservationWindow(agenda, {
      dateKey,
      currentUserId,
      stepMinutes: RESERVATION_DRAG_STEP_MINUTES,
    });
    setDraftWindow(free);
    onDraftWindowChange(free);
  }, [agenda, dateKey, currentUserId, onDraftWindowChange]);

  const applyDraftWindow = useCallback(
    (window: ReservationWindowMinutes | null) => {
      setDraftWindow(window);
      onDraftWindowChange(window);
    },
    [onDraftWindowChange],
  );

  const applyWindowFromCalendarEvent = useCallback(
    (event: { start: SelectedEventType['start']; end: SelectedEventType['end'] }) => {
      if (!agenda) return;
      const raw = calendarEventToWindowMinutes(event, dateKey);
      if (!raw) return;
      const clamped = clampReservationWindow(agenda, raw, {
        dateKey,
        currentUserId,
        stepMinutes: RESERVATION_DRAG_STEP_MINUTES,
      });
      applyDraftWindow(clamped);
    },
    [agenda, applyDraftWindow, currentUserId, dateKey],
  );

  const handleDragCreateEventEnd = useCallback(
    (event: OnCreateEventResponse) => {
      applyWindowFromCalendarEvent(event);
    },
    [applyWindowFromCalendarEvent],
  );

  const handleDragSelectedEventEnd = useCallback(
    (event: SelectedEventType) => {
      if (!event.start || !event.end) return;
      applyWindowFromCalendarEvent({ start: event.start, end: event.end });
    },
    [applyWindowFromCalendarEvent],
  );

  const goPrevDay = useCallback(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const next = formatLocalDateKey(dt);
    if (next < todayKey) return;
    setDateKey(next);
    calendarRef.current?.setVisibleDate(next);
  }, [dateKey, todayKey]);

  const goNextDay = useCallback(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    const next = formatLocalDateKey(dt);
    setDateKey(next);
    calendarRef.current?.setVisibleDate(next);
  }, [dateKey]);

  const handleDateChanged = useCallback(
    (nextDate: string) => {
      const key = nextDate.slice(0, 10);
      if (key < todayKey || key === dateKey) return;
      setDateKey(key);
    },
    [dateKey, todayKey],
  );

  const openMinutes = agenda?.operatingHours.openMinutes ?? 0;
  const closeMinutes = agenda?.operatingHours.closeMinutes ?? 24 * 60;

  const occupiedEvents = useMemo(() => {
    if (!agenda) return [];
    return mapOccupiedEvents(agenda, {
      dateKey,
      timeZone,
      currentUserId,
      isDark: colors.isDark,
    });
  }, [agenda, colors.isDark, currentUserId, dateKey, timeZone]);

  const unavailableHours = useMemo(() => {
    if (!agenda) return [];
    return buildUnavailableHoursByDate(agenda, dateKey, new Date());
  }, [agenda, dateKey]);

  const selectedEvent = useMemo(() => {
    if (!draftWindow) return undefined;
    return windowMinutesToSelectedEvent(
      draftWindow,
      dateKey,
      timeZone,
      colors.primary,
    );
  }, [colors.primary, dateKey, draftWindow, timeZone]);

  const hasBookableSlots = useMemo(() => {
    if (!agenda || agenda.date !== dateKey) return false;
    return hasBookableReservationSlotsForDate(agenda, {
      dateKey,
      currentUserId,
      stepMinutes: RESERVATION_DRAG_STEP_MINUTES,
    });
  }, [agenda, currentUserId, dateKey]);

  const limitHint = useMemo(() => {
    if (!agenda || !draftWindow) return null;
    const bounds = getEndTimeBoundsForWindow(agenda, {
      dateKey,
      startMinutes24: draftWindow.startMinutes24,
      currentUserId,
    });
    const grace = agenda.lateDepartureGraceMinutes ?? 10;
    return formatLimitHintMessage(bounds, grace);
  }, [agenda, currentUserId, dateKey, draftWindow]);

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

  const showSkeleton = loadingAgenda && !agenda;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.dayNav}>
          <Pressable
            onPress={goPrevDay}
            disabled={dateKey <= todayKey}
            style={({ pressed }) => [
              styles.dayBtn,
              { opacity: dateKey <= todayKey ? 0.35 : pressed ? 0.7 : 1 },
            ]}
          >
            <Icon name="chevron-left" size={18} color={colors.primary} />
          </Pressable>
          <Text style={[styles.dayLabel, { color: colors.text }]}>
            {formatDayLabel(dateKey)}
          </Text>
          <Pressable
            onPress={goNextDay}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {hasBookableSlots && draftWindow ? (
          <View
            style={[
              styles.summaryBand,
              { backgroundColor: colors.backgroundTertiary },
            ]}
          >
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {formatReservationWindowLabel(draftWindow)}
            </Text>
            {limitHint ? (
              <Text style={[styles.limitHint, { color: colors.textSecondary }]}>
                {limitHint}
              </Text>
            ) : (
              <Text style={[styles.limitHint, { color: colors.textSecondary }]}>
                Arrastra el bloque verde o crea uno nuevo en un hueco libre.
              </Text>
            )}
          </View>
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

      {showSkeleton ? (
        <AgendaSkeleton />
      ) : agenda && !hasBookableSlots ? (
        <View style={styles.emptyDay}>
          <Text style={[styles.emptyDayTitle, { color: colors.text }]}>
            No quedan horarios disponibles
          </Text>
          <Text style={[styles.emptyDayHint, { color: colors.textSecondary }]}>
            Probá otro día o revisá si ya no hay tiempo suficiente antes del
            cierre de la estación.
          </Text>
        </View>
      ) : (
        <View style={styles.calendarWrap}>
          <CalendarContainer
            ref={calendarRef}
            numberOfDays={1}
            scrollByDay
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
            timeInterval={30}
            initialTimeIntervalHeight={48}
            minTimeIntervalHeight={40}
            maxTimeIntervalHeight={72}
            dragStep={RESERVATION_DRAG_STEP_MINUTES}
            defaultDuration={agenda?.minReservationMinutes ?? 30}
            allowDragToCreate
            allowDragToEdit
            useHaptic
            useAllDayEvent={false}
            scrollToNow={dateKey === todayKey}
            isLoading={loadingAgenda}
            theme={calendarTheme}
            events={occupiedEvents}
            unavailableHours={unavailableHours}
            selectedEvent={selectedEvent}
            onDateChanged={handleDateChanged}
            onDragCreateEventEnd={handleDragCreateEventEnd}
            onDragSelectedEventEnd={handleDragSelectedEventEnd}
          >
            <CalendarHeader />
            <CalendarBody renderEvent={renderOccupiedEvent} />
          </CalendarContainer>
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
  dayBtn: { padding: 8 },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
    textAlign: 'center',
  },
  summaryBand: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  limitHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
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
  calendarWrap: {
    flex: 1,
    paddingHorizontal: 8,
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
