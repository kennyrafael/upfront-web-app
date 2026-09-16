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
  cancellationNoticeHours: number;
  /** `#RRGGBB`. Absent means Upfront's own green. */
  brandColor?: string;
  /** The public, versioned address of the logo. Absent until one is uploaded *and* a slug exists. */
  logoUrl?: string;
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
  cancellationNoticeHours?: number;
  depositPercent?: number;
  brandColor?: string;
}

export const providersApi = {
  me: () => api.get<ProviderProfile>('/providers/me'),
  update: (payload: UpdateProviderPayload) => api.patch<ProviderProfile>('/providers/me', payload),
  completeOnboarding: () => api.post<ProviderProfile>('/providers/me/onboarding/complete'),
  /** Mints a slug from the business name the first time, so publishing is one click. */
  enablePublicBooking: () => api.post<ProviderProfile>('/providers/me/public-booking/enable'),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.upload<ProviderProfile>('/providers/me/logo', form);
  },
  removeLogo: () => api.delete<ProviderProfile>('/providers/me/logo'),
  /**
   * The logo as a data URL, for the settings preview.
   *
   * `logoUrl` cannot serve that screen: it is a public address that only exists once the
   * booking page is published, so a provider still setting things up would see nothing.
   */
  myLogo: () => api.get<{ dataUrl: string }>('/providers/me/logo'),
};
