import { api } from './client';

export interface AuthenticatedUser {
  id: string;
  /** Scope for everything the signed-in account can see. Not `id`. */
  businessId: string;
  email: string;
  name: string;
  /** The shop's name. */
  businessName: string;
  phone?: string;
  /** What this account may do. Enforced on the server; the UI only stops asking. */
  role: 'owner' | 'manager' | 'front_desk' | 'staff';
  /** The person they are, when they perform services. Absent for a front desk. */
  employeeId?: string;
  /** Publishing a booking page needs this. Nothing else does. */
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  businessName?: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  signup: (payload: SignupPayload) => api.post<AuthResponse>('/auth/signup', payload),
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  me: () => api.get<AuthenticatedUser>('/auth/me'),

  /** Your own name and number — not the shop's. Those parted company in the split. */
  updateMe: (payload: { name?: string; phone?: string }) =>
    api.patch<AuthenticatedUser>('/auth/me', payload),

  /**
   * Sends no body and reads no token — the refresh cookie is httpOnly, so the browser
   * attaches it and script never sees it. That is the entire point of storing it there.
   */
  refresh: () => api.post<AuthResponse>('/auth/refresh'),
  logout: () => api.post<void>('/auth/logout'),

  forgotPassword: (email: string) => api.post<void>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<void>('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, password: string) =>
    api.post<void>('/auth/change-password', { currentPassword, password }),

  /** Starts a move to a new address; nothing changes until that address confirms. */
  changeEmail: (email: string, password: string) =>
    api.post<void>('/auth/change-email', { email, password }),
  confirmEmailChange: (token: string) =>
    api.post<{ email: string }>('/auth/confirm-email-change', { token }),

  verifyEmail: (token: string) => api.post<AuthenticatedUser>('/auth/verify-email', { token }),
  resendVerification: () => api.post<void>('/auth/resend-verification'),
};
