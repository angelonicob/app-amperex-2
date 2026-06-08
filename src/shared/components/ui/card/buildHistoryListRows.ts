import type { SessionHistoryItem } from '../../../../modules/session/history';
import {
  formatHistorySectionDate,
  getHistoryDateKey,
} from './historyFormat';

export type HistoryListRow =
  | { type: 'date'; id: string; label: string }
  | { type: 'session'; id: string; item: SessionHistoryItem };

export function buildHistoryListRows(items: SessionHistoryItem[]): HistoryListRow[] {
  const sorted = [...items].sort((a, b) => {
    const ta = new Date(a.startedAt ?? 0).getTime();
    const tb = new Date(b.startedAt ?? 0).getTime();
    return tb - ta;
  });

  const rows: HistoryListRow[] = [];
  let lastDateKey = '';

  for (const item of sorted) {
    const dateKey = getHistoryDateKey(item.startedAt);
    if (dateKey !== lastDateKey) {
      rows.push({
        type: 'date',
        id: `date-${dateKey}`,
        label: formatHistorySectionDate(item.startedAt),
      });
      lastDateKey = dateKey;
    }
    rows.push({ type: 'session', id: item.id, item });
  }

  return rows;
}
