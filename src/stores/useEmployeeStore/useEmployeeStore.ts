import { create } from 'zustand';
import {
  ApiError,
  type ClashingBooking,
  type Employee,
  type EmployeePayload,
  employeesApi,
  type TimeOff,
  type TimeOffPayload,
  timeOffApi,
} from '@/lib/api';

interface EmployeeState {
  items: Employee[];
  /** Somebody who left is hidden until asked for, the same way an archived service is. */
  includeInactive: boolean;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  setIncludeInactive: (includeInactive: boolean) => Promise<void>;
  create: (payload: EmployeePayload) => Promise<boolean>;
  update: (
    id: string,
    payload: Partial<EmployeePayload> & { active?: boolean },
  ) => Promise<boolean>;
  deactivate: (id: string) => Promise<boolean>;
  /**
   * Who is away, by employee id, for the window last asked for.
   *
   * Keyed rather than flat because the panel only ever shows one person at a time, and a
   * flat list would have to be refiltered on every render for no gain.
   */
  timeOff: Record<string, TimeOff[]>;
  /**
   * Appointments the last time-off entry landed on top of.
   *
   * Held so the UI can say so. Nothing was cancelled — this is the one place availability is
   * knowingly broken, and the person who recorded it is the one who decides what to do.
   */
  lastClashes: ClashingBooking[];
  loadTimeOff: (employeeId: string) => Promise<void>;
  addTimeOff: (employeeId: string, payload: TimeOffPayload) => Promise<boolean>;
  removeTimeOff: (employeeId: string, id: string) => Promise<boolean>;
  clearClashes: () => void;
  clearError: () => void;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  items: [],
  includeInactive: false,
  status: 'idle',
  error: null,

  /**
   * Everyone can read this, whatever their role — the booking form needs the list and the
   * calendar needs it to draw a column per person. Only changing it is restricted.
   */
  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ items: await employeesApi.list(get().includeInactive), status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  setIncludeInactive: async (includeInactive) => {
    set({ includeInactive });
    await get().load();
  },

  create: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      await employeesApi.create(payload);
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
      await employeesApi.update(id, payload);
      await get().load();
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  deactivate: async (id) => {
    set({ status: 'saving', error: null });
    try {
      await employeesApi.deactivate(id);
      await get().load();
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  timeOff: {},
  lastClashes: [],

  /** Three months out: far enough for a summer holiday, short enough to stay one request. */
  loadTimeOff: async (employeeId) => {
    const from = new Date();
    const to = new Date(from.getTime() + 90 * 24 * 60 * 60_000);
    try {
      const away = await timeOffApi.list(employeeId, from.toISOString(), to.toISOString());
      set((state) => ({ timeOff: { ...state.timeOff, [employeeId]: away } }));
    } catch (error) {
      set({ error: toMessage(error) });
    }
  },

  addTimeOff: async (employeeId, payload) => {
    set({ status: 'saving', error: null, lastClashes: [] });
    try {
      const { clashes } = await timeOffApi.add(employeeId, payload);
      set({ status: 'idle', lastClashes: clashes });
      await get().loadTimeOff(employeeId);
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  removeTimeOff: async (employeeId, id) => {
    set({ status: 'saving', error: null });
    try {
      await timeOffApi.remove(id);
      set({ status: 'idle' });
      await get().loadTimeOff(employeeId);
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  clearClashes: () => set({ lastClashes: [] }),

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      items: [],
      includeInactive: false,
      status: 'idle',
      error: null,
      timeOff: {},
      lastClashes: [],
    }),
}));
