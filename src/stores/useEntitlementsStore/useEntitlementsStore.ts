import { create } from 'zustand';
import { ApiError, type Entitlements, entitlementsApi, type SmsUsage } from '@/lib/api';

interface EntitlementsState {
  entitlements: Entitlements | null;
  smsUsage: SmsUsage | null;
  status: 'idle' | 'loading';
  error: string | null;
  load: () => Promise<void>;
  reset: () => void;
}

/**
 * What this business may do, and how much of the metered part it has used.
 *
 * **Read from the server, never derived from a plan name held here.** A plan is renamed, split
 * or granted to one customer as a favour; a capability is not, and a client that computes its
 * own answer is a second copy of the rule that will eventually disagree with the first.
 *
 * Both calls are made together because everything that reads this wants both: whether the
 * capability is on, and how much of it is left. Failing quietly is deliberate — this decides
 * whether a panel renders, and a settings page that will not load because a usage count was
 * unavailable is worse than one that omits the count.
 */
export const useEntitlementsStore = create<EntitlementsState>((set) => ({
  entitlements: null,
  smsUsage: null,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const [entitlements, smsUsage] = await Promise.all([
        entitlementsApi.mine(),
        entitlementsApi.smsUsage(),
      ]);
      set({ entitlements, smsUsage, status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  reset: () => set({ entitlements: null, smsUsage: null, status: 'idle', error: null }),
}));

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
