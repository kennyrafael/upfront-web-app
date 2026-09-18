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
  /**
   * Which shape the calendar is in.
   *
   * A week of one person, or a day of everybody. Those are the two questions a shop asks,
   * and a week × five people does not fit on a screen and never will.
   */
  view: 'week' | 'day';
  /** The day the day view is showing. Always inside the loaded week. */
  day: Date;
  /** Week view, one person at a time. Undefined means everybody — only useful for one-person shops. */
  weekEmployeeId?: string;
  setView: (view: 'week' | 'day') => void;
  setWeekEmployee: (employeeId?: string) => void;
  goToDay: (day: Date) => Promise<void>;
  shiftDay: (days: number) => Promise<void>;
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
  view: 'week',
  day: new Date(),
  weekEmployeeId: undefined,

  setView: (view) => set({ view }),
  setWeekEmployee: (weekEmployeeId) => set({ weekEmployeeId }),

  /**
   * Moves the day view, reloading only when the day leaves the week already in memory.
   *
   * The fetch stays week-shaped whichever view is on screen, so switching between them costs
   * nothing and the day view always has its data.
   */
  goToDay: async (day) => {
    const week = startOfWeek(day);
    const sameWeek = week.getTime() === get().weekStart.getTime();
    set({ day, weekStart: week });
    if (!sameWeek) await get().load();
  },

  shiftDay: async (days) => {
    await get().goToDay(addDays(get().day, days));
  },
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

  reset: () =>
    set({
      items: [],
      weekStart: startOfWeek(new Date()),
      day: new Date(),
      view: 'week',
      weekEmployeeId: undefined,
      status: 'idle',
      error: null,
    }),
}));
