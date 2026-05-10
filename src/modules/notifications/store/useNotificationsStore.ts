import { create } from 'zustand';
import type { Notification } from '../types';
import {
  getNotifications,
  markNotificationAsRead as apiMarkAsRead,
  deleteNotification as apiDeleteNotification,
  deleteAllNotifications as apiDeleteAllNotifications,
} from '../api';

function unreadFromItems(items: Notification[]): number {
  return items.filter((n) => !n.readAt).length;
}

/** Mantiene un solo ítem por id; el orden del array de entrada se respeta en la salida. */
function dedupeById(items: Notification[]): Notification[] {
  const seen = new Set<string>();
  const out: Notification[] = [];
  for (const n of items) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
  }
  return out;
}

/**
 * `preferred` primero en orden; valores de `preferred` pisan a `rest` para el mismo id.
 */
function mergeNotificationsById(preferred: Notification[], rest: Notification[]): Notification[] {
  const byId = new Map<string, Notification>();
  for (const n of rest) byId.set(n.id, n);
  for (const n of preferred) byId.set(n.id, n);
  const order: string[] = [];
  for (const n of preferred) {
    if (!order.includes(n.id)) order.push(n.id);
  }
  for (const n of rest) {
    if (!order.includes(n.id)) order.push(n.id);
  }
  return order.map((id) => byId.get(id)!);
}

let notificationsLoadGeneration = 0;

export interface NotificationsState {
  items: Notification[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  loadNotifications: (params?: { limit?: number; offset?: number }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  prependNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  items: [],
  total: 0,
  unreadCount: 0,
  isLoading: false,

  loadNotifications: async (params) => {
    const myGeneration = ++notificationsLoadGeneration;
    set({ isLoading: true });
    try {
      const res = await getNotifications(params ?? { limit: 50, offset: 0 });
      if (myGeneration !== notificationsLoadGeneration) return;
      const items = dedupeById(res.data ?? []);
      const total = res.total ?? items.length;
      const unreadCount = unreadFromItems(items);
      set({ items, total, unreadCount, isLoading: false });
    } catch (e) {
      console.warn('Error loading notifications', e);
      if (myGeneration === notificationsLoadGeneration) {
        set({ isLoading: false });
      }
    }
  },

  markAsRead: async (id) => {
    const ok = await apiMarkAsRead(id);
    if (!ok) return;
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      );
      return { items, unreadCount: unreadFromItems(items) };
    });
  },

  removeNotification: async (id) => {
    const ok = await apiDeleteNotification(id);
    if (!ok) return;
    set((state) => {
      const items = state.items.filter((n) => n.id !== id);
      return {
        items,
        total: Math.max(0, state.total - 1),
        unreadCount: unreadFromItems(items),
      };
    });
  },

  clearAllNotifications: async () => {
    const ok = await apiDeleteAllNotifications();
    if (!ok) return;
    set({ items: [], total: 0, unreadCount: 0 });
  },

  prependNotification: (notification) => {
    set((state) => {
      const existed = state.items.some((n) => n.id === notification.id);
      const items = mergeNotificationsById([notification], state.items);
      return {
        items,
        total: existed ? state.total : state.total + 1,
        unreadCount: unreadFromItems(items),
      };
    });
  },
}));
