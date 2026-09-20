import { create } from 'zustand';
import {
  ApiError,
  type Booking,
  bookingsApi,
  type CreateBookingPayload,
  type DaySummary,
  type UpdateBookingPayload,
} from '@/lib/api';
import { addDays, addMonths, startOfMonth, startOfWeek } from '@/lib/utils';

/**
 * Six weeks of cells, always.
 *
 * A month spans five or six weeks depending on which weekday it starts on; a grid that
 * changes height as you page through the year is a grid that jumps under the cursor.
 */
const MONTH_GRID_DAYS = 42;

/** The Monday on or before the first of the month. */
function monthGridStart(monthStart: Date): Date {
  return startOfWeek(monthStart);
}

interface BookingState {
  items: Booking[];
  /** Monday 00:00 of the week currently on screen. */
  weekStart: Date;
  /**
   * Which shape the calendar is in.
   *
   * A day of everybody, a week of one person, or a month of nobody in particular. No
   * single grid answers every question — a week × five people does not fit on a screen
   * and never will — so the shop picks the one that suits the moment.
   */
  view: 'week' | 'day' | 'month';
  /** The day the day view is showing. Always inside the loaded week. */
  day: Date;
  /** The first of the month on screen, when the month view is on. */
  monthStart: Date;
  /**
   * One row per day of the month grid, rather than the bookings themselves.
   *
   * A month of a busy shop is more appointments than the list endpoint will return, so
   * the cells are counts and a glimpse — the day view has the detail.
   */
  monthDays: DaySummary[];
  /** Week view, one person at a time. Undefined means everybody — only useful for one-person shops. */
  weekEmployeeId?: string;
  setView: (view: 'week' | 'day' | 'month') => Promise<void>;
  setWeekEmployee: (employeeId?: string) => void;
  goToDay: (day: Date) => Promise<void>;
  shiftDay: (days: number) => Promise<void>;
  /** Loads the six weeks the month grid shows. */
  loadMonth: () => Promise<void>;
  goToMonth: (date: Date) => Promise<void>;
  shiftMonth: (months: number) => Promise<void>;
  /** From a month cell into that day — the month is for finding, the day for working. */
  openDay: (day: Date) => Promise<void>;
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
  monthStart: startOfMonth(new Date()),
  monthDays: [],
  weekEmployeeId: undefined,

  /**
   * Switches grid, fetching only when the range actually changes.
   *
   * Day and week share one week-shaped fetch, so moving between them costs nothing.
   * The month is six weeks of a different shape, so crossing that boundary — in either
   * direction — is the only switch that goes to the server.
   */
  setView: async (view) => {
    const previous = get().view;
    set({ view });

    if (view === 'month') await get().loadMonth();
    else if (previous === 'month') await get().load();
  },

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

  loadMonth: async () => {
    const { monthStart } = get();
    set({ status: 'loading', error: null });
    try {
      const from = monthGridStart(monthStart);
      set({
        monthDays: await bookingsApi.month({
          from: from.toISOString(),
          to: addDays(from, MONTH_GRID_DAYS).toISOString(),
        }),
        status: 'idle',
      });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  goToMonth: async (date) => {
    set({ monthStart: startOfMonth(date) });
    await get().loadMonth();
  },

  shiftMonth: async (months) => {
    await get().goToMonth(addMonths(get().monthStart, months));
  },

  /**
   * Always fetches, unlike `goToDay`.
   *
   * The month view does not keep the week-shaped list up to date, so whatever is in
   * `items` on the way out of it is whatever was last loaded — possibly the right week
   * and possibly a month ago. One request on a deliberate click is the cheap, correct
   * answer; guessing when it can be skipped is how a day view shows yesterday's data.
   */
  openDay: async (day) => {
    set({ view: 'day', day, weekStart: startOfWeek(day) });
    await get().load();
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
      monthStart: startOfMonth(new Date()),
      monthDays: [],
      view: 'week',
      weekEmployeeId: undefined,
      status: 'idle',
      error: null,
    }),
}));
