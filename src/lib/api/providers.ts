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
  slug?: string;
  publicBookingEnabled: boolean;
  autoConfirmPublicBookings: boolean;
  bookingLeadTimeHours: number;
  bookingHorizonDays: number;
  depositPercent: number;
}

export interface UpdateProviderPayload {
  name?: string;
  businessName?: string;
  phone?: string;
  nif?: string;
  timezone?: string;
  workingHours?: WorkingHours[];
  slug?: string;
  publicBookingEnabled?: boolean;
  autoConfirmPublicBookings?: boolean;
  bookingLeadTimeHours?: number;
  bookingHorizonDays?: number;
  depositPercent?: number;
}

export const providersApi = {
  me: () => api.get<ProviderProfile>('/providers/me'),
  update: (payload: UpdateProviderPayload) => api.patch<ProviderProfile>('/providers/me', payload),
  completeOnboarding: () => api.post<ProviderProfile>('/providers/me/onboarding/complete'),
  /** Mints a slug from the business name the first time, so publishing is one click. */
  enablePublicBooking: () => api.post<ProviderProfile>('/providers/me/public-booking/enable'),
};
