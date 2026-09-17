import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ApiError,
  type AuthenticatedUser,
  authApi,
  type LoginPayload,
  type SignupPayload,
  setSessionHandlers,
  setTokenReader,
} from '@/lib/api';

interface AuthState {
  user: AuthenticatedUser | null;
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
  /** Your own name and number. Returns false on failure, with the message in `error`. */
  updateMe: (payload: { name?: string; phone?: string }) => Promise<boolean>;
  /** After confirming an email address, so the banner disappears without a reload. */
  markVerified: (user: AuthenticatedUser) => void;
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
      user: null,
      accessToken: null,
      status: 'idle',
      error: null,

      login: async (payload) => {
        set({ status: 'loading', error: null });
        try {
          const { accessToken, user } = await authApi.login(payload);
          set({ accessToken, user, status: 'idle' });
          return true;
        } catch (error) {
          set({ status: 'idle', error: toMessage(error) });
          return false;
        }
      },

      signup: async (payload) => {
        set({ status: 'loading', error: null });
        try {
          const { accessToken, user } = await authApi.signup(payload);
          set({ accessToken, user, status: 'idle' });
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
        set({ user: null, accessToken: null, error: null });
      },

      refresh: async () => {
        try {
          const { accessToken, user } = await authApi.refresh();
          set({ accessToken, user });
          return accessToken;
        } catch {
          set({ user: null, accessToken: null });
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
          set({ user: await authApi.me() });
        } catch {
          await get().refresh();
        }
      },

      updateMe: async (payload) => {
        set({ status: 'loading', error: null });
        try {
          set({ user: await authApi.updateMe(payload), status: 'idle' });
          return true;
        } catch (error) {
          set({ status: 'idle', error: toMessage(error) });
          return false;
        }
      },

      markVerified: (user) => set({ user }),

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      /**
       * v0 persisted the signed-in account as `provider`. It is now `user`, and carries a
       * `businessId` the old shape never had.
       *
       * Discarding rather than reshaping is deliberate: an ended session is a state every
       * page already handles, and a half-shaped one is not. The cost is that everyone signs
       * in again once.
       */
      migrate: () => ({ accessToken: null, user: null }),
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
);

// The API client reads the token lazily, so it never imports the store back.
setTokenReader(() => useAuthStore.getState().accessToken);

// And it calls back here when a request meets a 401, so one expired access token is renewed
// rather than dumping the user on the sign-in screen mid-task.
setSessionHandlers({
  refresh: () => useAuthStore.getState().refresh(),
  onSignedOut: () => useAuthStore.setState({ user: null, accessToken: null }),
});
