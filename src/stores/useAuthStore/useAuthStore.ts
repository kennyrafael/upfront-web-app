import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ApiError,
  authApi,
  type LoginPayload,
  type Provider,
  type SignupPayload,
  setSessionHandlers,
  setTokenReader,
} from '@/lib/api';

interface AuthState {
  provider: Provider | null;
  accessToken: string | null;
  status: 'idle' | 'loading';
  error: string | null;
  login: (payload: LoginPayload) => Promise<boolean>;
  signup: (payload: SignupPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  /** Trades the refresh cookie for a new access token. Null means the session is over. */
  refresh: () => Promise<string | null>;
  /** Revalidates on boot, falling back to the refresh cookie before giving up. */
  restore: () => Promise<void>;
  /** After confirming an email address, so the banner disappears without a reload. */
  markVerified: (provider: Provider) => void;
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

      /**
       * Tells the server to revoke the session before forgetting it here.
       *
       * Clearing the local copy alone used to be the whole of signing out, which meant the
       * token stayed valid for a week in anyone else's hands. Now the refresh token is
       * revoked server-side, so it is genuinely over.
       */
      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Already gone, or the network is down. Either way, sign out locally.
        }
        set({ provider: null, accessToken: null, error: null });
      },

      refresh: async () => {
        try {
          const { accessToken, provider } = await authApi.refresh();
          set({ accessToken, provider });
          return accessToken;
        } catch {
          set({ provider: null, accessToken: null });
          return null;
        }
      },

      /**
       * On boot the stored access token is usually already stale — it only lasts fifteen
       * minutes and a browser tab outlives that easily. So a failed `me()` is not a reason
       * to sign someone out; the refresh cookie is the real session, and it is good for
       * weeks. Only when that fails too is the session actually over.
       */
      restore: async () => {
        if (!get().accessToken) return;
        try {
          set({ provider: await authApi.me() });
        } catch {
          await get().refresh();
        }
      },

      markVerified: (provider) => set({ provider }),

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

// And it calls back here when a request meets a 401, so one expired access token is renewed
// rather than dumping the provider on the sign-in screen mid-task.
setSessionHandlers({
  refresh: () => useAuthStore.getState().refresh(),
  onSignedOut: () => useAuthStore.setState({ provider: null, accessToken: null }),
});
