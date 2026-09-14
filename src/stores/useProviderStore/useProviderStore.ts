import { create } from 'zustand';
import {
  ApiError,
  type ProviderProfile,
  providersApi,
  type UpdateProviderPayload,
} from '@/lib/api';

interface ProviderState {
  profile: ProviderProfile | null;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  update: (payload: UpdateProviderPayload) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useProviderStore = create<ProviderState>((set) => ({
  profile: null,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ profile: await providersApi.me(), status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  update: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      set({ profile: await providersApi.update(payload), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  completeOnboarding: async () => {
    set({ status: 'saving', error: null });
    try {
      set({ profile: await providersApi.completeOnboarding(), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ profile: null, status: 'idle', error: null }),
}));

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
