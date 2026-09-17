import { create } from 'zustand';
import { ApiError, type Employee, type EmployeePayload, employeesApi } from '@/lib/api';

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

  clearError: () => set({ error: null }),
  reset: () => set({ items: [], includeInactive: false, status: 'idle', error: null }),
}));
