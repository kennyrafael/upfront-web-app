import { api } from './client';

export interface Provider {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
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
};
