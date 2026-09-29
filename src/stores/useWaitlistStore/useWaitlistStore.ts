import { create } from 'zustand';
import {
  ApiError,
  type CreateWaitlistEntryPayload,
  type WaitlistEntry,
  waitlistApi,
} from '@/lib/api';

interface WaitlistState {
  items: WaitlistEntry[];
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  /** True once the capability has been refused, so the panel can say why rather than retry. */
  unavailable: boolean;
  load: () => Promise<void>;
  add: (payload: CreateWaitlistEntryPayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Who is waiting for a slot that was not free.
 *
 * **A 403 is recorded rather than shown as an error.** The whole module is gated on the
 * `waitlist` capability, so a business without it gets a refusal on the first read — which
 * is an answer about their plan, not a failure. Treating it as one would put a red banner on
 * a page for a feature they simply have not bought.
 */
export const useWaitlistStore = create<WaitlistState>((set, get) => ({
  items: [],
  status: 'idle',
  error: null,
  unavailable: false,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ items: await waitlistApi.list(), status: 'idle', unavailable: false });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        set({ items: [], status: 'idle', unavailable: true });
        return;
      }
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  add: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      const entry = await waitlistApi.create(payload);
      set({ items: [...get().items, entry], status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  /**
   * Dropped from the list here rather than re-fetched: the API marks it `cancelled` and the
   * list only ever carries `waiting`, so the row is gone either way and a round trip would
   * only make the click feel slower.
   */
  remove: async (id) => {
    set({ status: 'saving', error: null });
    try {
      await waitlistApi.cancel(id);
      set({ items: get().items.filter((entry) => entry.id !== id), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ items: [], status: 'idle', error: null, unavailable: false }),
}));
