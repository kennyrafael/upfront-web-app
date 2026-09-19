import { create } from 'zustand';
import {
  ApiError,
  type CategoryItem,
  type CreateCategoryPayload,
  categoriesApi,
  type UpdateCategoryPayload,
} from '@/lib/api';

interface CategoryState {
  items: CategoryItem[];
  /** Services per category, keyed by id. Loaded with the list, so a delete can warn. */
  counts: Record<string, number>;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  create: (payload: CreateCategoryPayload) => Promise<boolean>;
  update: (id: string, payload: UpdateCategoryPayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  /** Swaps a category with its neighbour. The list is short; up and down is enough. */
  move: (id: string, direction: -1 | 1) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  items: [],
  counts: {},
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const [items, counts] = await Promise.all([categoriesApi.list(), categoriesApi.counts()]);
      set({ items, counts, status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  create: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      await categoriesApi.create(payload);
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
      await categoriesApi.update(id, payload);
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
      await categoriesApi.remove(id);
      await get().load();
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  /**
   * Swaps two neighbours by writing both positions.
   *
   * Two requests rather than one reorder endpoint, because the list is a handful of rows
   * and an endpoint that takes an ordering is a second way to write the same field. The
   * pair is not atomic: a failure between them leaves two categories sharing a position,
   * which sorts by name and is fixed by pressing the button again.
   */
  move: async (id, direction) => {
    const items = get().items;
    const index = items.findIndex((item) => item.id === id);
    const swapWith = items[index + direction];
    if (index === -1 || !swapWith) return;

    set({ status: 'saving', error: null });
    try {
      await categoriesApi.update(id, { position: swapWith.position });
      await categoriesApi.update(swapWith.id, { position: items[index].position });
      await get().load();
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], counts: {}, status: 'idle', error: null }),
}));

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
