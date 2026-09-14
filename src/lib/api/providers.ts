import { api } from './client';

export interface WorkingHours {
  /** 0 = Sunday, matching JS `Date#getDay`. */
  weekday: number;
  start: string;
  end: string;
}

export interface ProviderProfile {
  id: string;
  email: string;
  name: string;
  businessName?: string;
  phone?: string;
  nif?: string;
  timezone: string;
  onboardedAt?: string;
  workingHours: WorkingHours[];
}

export interface UpdateProviderPayload {
  name?: string;
  businessName?: string;
  phone?: string;
  nif?: string;
  timezone?: string;
  workingHours?: WorkingHours[];
}

export const providersApi = {
  me: () => api.get<ProviderProfile>('/providers/me'),
  update: (payload: UpdateProviderPayload) => api.patch<ProviderProfile>('/providers/me', payload),
  completeOnboarding: () => api.post<ProviderProfile>('/providers/me/onboarding/complete'),
};
