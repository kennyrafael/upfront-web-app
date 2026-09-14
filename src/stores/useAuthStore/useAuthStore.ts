import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ApiError,
  authApi,
  type LoginPayload,
  type Provider,
  type SignupPayload,
  setTokenReader,
} from '@/lib/api';

interface AuthState {
  provider: Provider | null;
  accessToken: string | null;
  status: 'idle' | 'loading';
  error: string | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  signup: (payload: SignupPayload) => Promise<boolean>;
  logout: () => void;
  /** Revalidates a persisted token on app boot; clears it if the API rejects it. */
  restore: () => Promise<void>;
  clearError: () => void;
}

const STORAGE_KEY = 'upfront.auth';

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      provider: null,
      accessToken: null,
      status: 'idle',
      error: null,

      login: async (payload) => {
        set({ status: 'loading', error: null });
        try {
          const { accessToken, provider } = await authApi.login(payload);
          set({ accessToken, provider, status: 'idle' });
          return true;
        } catch (error) {
          set({ status: 'idle', error: toMessage(error) });
          return false;
        }
      },

      signup: async (payload) => {
        set({ status: 'loading', error: null });
        try {
          const { accessToken, provider } = await authApi.signup(payload);
          set({ accessToken, provider, status: 'idle' });
          return true;
        } catch (error) {
          set({ status: 'idle', error: toMessage(error) });
          return false;
        }
      },

      logout: () => set({ provider: null, accessToken: null, error: null }),

      restore: async () => {
        if (!get().accessToken) return;
        try {
          set({ provider: await authApi.me() });
        } catch {
          set({ provider: null, accessToken: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ accessToken: state.accessToken, provider: state.provider }),
    },
  ),
);

// The API client reads the token lazily, so it never imports the store back.
setTokenReader(() => useAuthStore.getState().accessToken);
