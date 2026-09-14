import { create } from 'zustand';
import {
  ApiError,
  type CreatePaymentPayload,
  type LedgerEntry,
  type PaymentsSummary,
  paymentsApi,
  type UpdatePaymentPayload,
} from '@/lib/api';

export type LedgerFilter = 'all' | 'owing' | 'settled';

interface PaymentState {
  entries: LedgerEntry[];
  summary: PaymentsSummary | null;
  filter: LedgerFilter;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  setFilter: (filter: LedgerFilter) => void;
  create: (payload: CreatePaymentPayload) => Promise<boolean>;
  update: (id: string, payload: UpdatePaymentPayload) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  entries: [],
  summary: null,
  filter: 'all',
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const [entries, summary] = await Promise.all([paymentsApi.ledger(), paymentsApi.summary()]);
      set({ entries, summary, status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  // Filtering is client-side: the ledger is one row per booking, small enough that a
  // round trip per toggle would be the slower option.
  setFilter: (filter) => set({ filter }),

  create: async (payload) => run(set, get, () => paymentsApi.create(payload)),
  update: async (id, payload) => run(set, get, () => paymentsApi.update(id, payload)),
  remove: async (id) => run(set, get, () => paymentsApi.remove(id)),

  clearError: () => set({ error: null }),

  reset: () => set({ entries: [], summary: null, filter: 'all', status: 'idle', error: null }),
}));

/** Any write shifts totals across the whole ledger, so reload rather than patch in place. */
async function run(
  set: (partial: Partial<PaymentState>) => void,
  get: () => PaymentState,
  action: () => Promise<unknown>,
): Promise<boolean> {
  set({ status: 'saving', error: null });
  try {
    await action();
    await get().load();
    return true;
  } catch (error) {
    set({ status: 'idle', error: toMessage(error) });
    return false;
  }
}
