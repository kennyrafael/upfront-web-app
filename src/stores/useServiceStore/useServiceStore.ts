import { create } from 'zustand';
import {
  ApiError,
  type CreateServicePayload,
  type ServiceItem,
  servicesApi,
  type UpdateServicePayload,
} from '@/lib/api';

interface ServiceState {
  items: ServiceItem[];
  /** Archived services are hidden until the provider asks to see them. */
  includeInactive: boolean;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  setIncludeInactive: (includeInactive: boolean) => Promise<void>;
  create: (payload: CreateServicePayload) => Promise<boolean>;
  update: (id: string, payload: UpdateServicePayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  items: [],
  includeInactive: false,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ items: await servicesApi.list(get().includeInactive), status: 'idle' });
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
      await servicesApi.create(payload);
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
      const updated = await servicesApi.update(id, payload);
      // Reload rather than patch in place: an archived service may drop out of the
      // current filter, and the list is small enough that a refetch is cheap.
      set({ items: get().items.map((item) => (item.id === id ? updated : item)) });
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
      await servicesApi.remove(id);
      set({ items: get().items.filter((item) => item.id !== id), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], includeInactive: false, status: 'idle', error: null }),
}));

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
