import { create } from 'zustand';
import {
  ApiError,
  type ClientRecord,
  type CreateClientPayload,
  clientsApi,
  MAX_PAGE_SIZE,
  type UpdateClientPayload,
} from '@/lib/api';

interface ClientState {
  items: ClientRecord[];
  /** Rows matching the search, so a truncated list can say so rather than look complete. */
  total: number;
  search: string;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  create: (payload: CreateClientPayload) => Promise<ClientRecord | null>;
  update: (id: string, payload: UpdateClientPayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useClientStore = create<ClientState>((set, get) => ({
  items: [],
  total: 0,
  search: '',
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const { items, total } = await clientsApi.list(get().search || undefined, {
        pageSize: MAX_PAGE_SIZE,
      });
      set({ items, total, status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  setSearch: async (search) => {
    set({ search });
    await get().load();
  },

  create: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      const created = await clientsApi.create(payload);
      await get().load();
      return created;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return null;
    }
  },

  update: async (id, payload) => {
    set({ status: 'saving', error: null });
    try {
      await clientsApi.update(id, payload);
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
      await clientsApi.remove(id);
      set({ items: get().items.filter((item) => item.id !== id), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], total: 0, search: '', status: 'idle', error: null }),
}));
