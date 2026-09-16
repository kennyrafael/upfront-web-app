import { create } from 'zustand';
import { type Alert, alertsApi } from '@/lib/api';

interface AlertState {
  items: Alert[];
  unread: number;
  loading: boolean;
  /** Cheap enough to run on a timer: a count, not a page of rows. */
  refreshCount: () => Promise<void>;
  load: () => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  items: [],
  unread: 0,
  loading: false,

  refreshCount: async () => {
    try {
      const { unread } = await alertsApi.unreadCount();
      set({ unread });
    } catch {
      // A failed poll is not worth an error banner. The next tick tries again, and a
      // genuinely dead session is caught by the request that the provider actually made.
    }
  },

  load: async () => {
    set({ loading: true });
    try {
      const { items } = await alertsApi.findAll();
      set({ items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  markAllRead: async () => {
    // Zeroed first: the badge should go out the moment the menu opens, not a round trip
    // later. The list keeps its own `readAt` so nothing visibly jumps.
    set({ unread: 0 });
    try {
      await alertsApi.markAllRead();
    } catch {
      await get().refreshCount();
    }
  },

  reset: () => set({ items: [], unread: 0, loading: false }),
}));
