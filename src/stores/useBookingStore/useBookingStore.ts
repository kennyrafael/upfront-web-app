import { create } from 'zustand';
import {
  ApiError,
  type Booking,
  bookingsApi,
  type CreateBookingPayload,
  type UpdateBookingPayload,
} from '@/lib/api';
import { addDays, startOfWeek } from '@/lib/utils';

interface BookingState {
  items: Booking[];
  /** Monday 00:00 of the week currently on screen. */
  weekStart: Date;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  goToWeek: (weekStart: Date) => Promise<void>;
  shiftWeek: (weeks: number) => Promise<void>;
  create: (payload: CreateBookingPayload) => Promise<boolean>;
  update: (id: string, payload: UpdateBookingPayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useBookingStore = create<BookingState>((set, get) => ({
  items: [],
  weekStart: startOfWeek(new Date()),
  status: 'idle',
  error: null,

  load: async () => {
    const { weekStart } = get();
    set({ status: 'loading', error: null });
    try {
      const { items } = await bookingsApi.list({
        from: weekStart.toISOString(),
        to: addDays(weekStart, 7).toISOString(),
      });
      set({ items, status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  goToWeek: async (weekStart) => {
    set({ weekStart: startOfWeek(weekStart) });
    await get().load();
  },

  shiftWeek: async (weeks) => {
    await get().goToWeek(addDays(get().weekStart, weeks * 7));
  },

  create: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      await bookingsApi.create(payload);
      await get().load();
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  update: async (id, payload) => {
    set({ status: 'saving', error: null });
    try {
      await bookingsApi.update(id, payload);
      // A reschedule can move a booking out of the visible week, so refetch the range
      // rather than patching the item in place.
      await get().load();
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  remove: async (id) => {
    set({ status: 'saving', error: null });
    try {
      await bookingsApi.remove(id);
      set({ items: get().items.filter((item) => item.id !== id), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], weekStart: startOfWeek(new Date()), status: 'idle', error: null }),
}));
