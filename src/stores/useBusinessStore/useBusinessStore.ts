import { create } from 'zustand';
import {
  ApiError,
  type BusinessProfile,
  businessesApi,
  type UpdateBusinessPayload,
} from '@/lib/api';

interface ProviderState {
  profile: BusinessProfile | null;
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  update: (payload: UpdateBusinessPayload) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useBusinessStore = create<ProviderState>((set) => ({
  profile: null,
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ profile: await businessesApi.me(), status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  update: async (payload) => {
    set({ status: 'saving', error: null });
    try {
      set({ profile: await businessesApi.update(payload), status: 'idle' });
      return true;
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
      return false;
    }
  },

  completeOnboarding: async () => {
    set({ status: 'saving', error: null });
    try {
      set({ profile: await businessesApi.completeOnboarding(), status: 'idle' });
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
