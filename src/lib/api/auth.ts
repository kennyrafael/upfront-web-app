import { api } from './client';

export interface Provider {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  /** Publishing a booking page needs this. Nothing else does. */
  emailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  provider: Provider;
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
  me: () => api.get<Provider>('/auth/me'),

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

  verifyEmail: (token: string) => api.post<Provider>('/auth/verify-email', { token }),
  resendVerification: () => api.post<void>('/auth/resend-verification'),
};
