import type { SessionHistoryItem } from '../../../../modules/session/history';

/** Clave de día para agrupar (YYYY-MM-DD en hora local). */
export function getHistoryDateKey(iso: string | null | undefined): string {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Ej. "20 oct 2025" */
export function formatHistorySectionDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const raw = d.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return raw.replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

/** Hora en 24h, ej. "14:30" */
export function formatHistoryTime24(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Tiempo transcurrido desde un ISO, ej. "12m 34s" o "1h 5m" */
export function formatElapsedSince(
  startedAt: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start) || start > nowMs) return '—';
  const totalSeconds = Math.floor((nowMs - start) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    if (minutes > 0) return `${hours}h ${minutes}m`;
    return `${hours}h`;
  }
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Duración entre inicio y fin, ej. "2h 15m" */
export function formatHistoryDuration(
  startedAt: string | null | undefined,
  endedAt: string | null | undefined,
): string {
  if (!startedAt || !endedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return '—';
  const totalMinutes = Math.floor((end - start) / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function formatHistorySoc(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n)}%`;
}

export function formatHistoryPrice(
  amount: unknown,
  currency: string | null | undefined,
): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return '—';
  const code = (currency ?? 'CLP').trim() || 'CLP';
  return `${Math.round(n).toLocaleString('es-CL')} ${code}`;
}

function eventPayload(
  item: SessionHistoryItem,
  type: string,
): Record<string, unknown> | null {
  const event = item.events?.find((e) => e.type === type);
  const payload = event?.payload;
  return payload && typeof payload === 'object' ? payload : null;
}

export function getHistoryCardMeta(item: SessionHistoryItem) {
  const params = eventPayload(item, 'session.params');
  const finished = eventPayload(item, 'session.finished');

  const initialSoc =
    params?.initialSocPercent ?? params?.initialSoc ?? null;
  const finalSoc =
    params?.targetSocPercent ??
    item.targetPercentage ??
    finished?.finalPercentage ??
    null;

  const amount =
    item.payment?.amount ??
    finished?.totalCostClp ??
    finished?.totalCost ??
    null;
  const currency =
    (item.payment?.currency as string | undefined) ??
    (finished?.currency as string | undefined) ??
    'CLP';

  return {
    initialSoc,
    finalSoc,
    amount,
    currency,
    timeRange: `${formatHistoryTime24(item.startedAt)} - ${formatHistoryTime24(item.endedAt)}`,
    duration: formatHistoryDuration(item.startedAt, item.endedAt),
    priceLabel: formatHistoryPrice(amount, currency),
  };
}
