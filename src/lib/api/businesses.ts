import { api } from './client';

export interface WorkingHours {
  /** 0 = Sunday, matching JS `Date#getDay`. */
  weekday: number;
  start: string;
  end: string;
}

/** The shop. The person signing in is `AuthenticatedUser` — they stopped being one record. */
export interface BusinessProfile {
  id: string;
  name: string;
  phone?: string;
  nif?: string;
  timezone: string;
  onboardedAt?: string;
  /** When the shop is open. A ceiling: availability is this intersected with a person's own. */
  hours: WorkingHours[];
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

export interface UpdateBusinessPayload {
  name?: string;
  phone?: string;
  nif?: string;
  timezone?: string;
  hours?: WorkingHours[];
  slug?: string;
  publicBookingEnabled?: boolean;
  autoConfirmPublicBookings?: boolean;
  bookingLeadTimeHours?: number;
  bookingHorizonDays?: number;
  cancellationNoticeHours?: number;
  depositPercent?: number;
  brandColor?: string;
}

export const businessesApi = {
  me: () => api.get<BusinessProfile>('/businesses/me'),
  update: (payload: UpdateBusinessPayload) => api.patch<BusinessProfile>('/businesses/me', payload),
  completeOnboarding: () => api.post<BusinessProfile>('/businesses/me/onboarding/complete'),
  /** Mints a slug from the business name the first time, so publishing is one click. */
  enablePublicBooking: () => api.post<BusinessProfile>('/businesses/me/public-booking/enable'),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.upload<BusinessProfile>('/businesses/me/logo', form);
  },
  removeLogo: () => api.delete<BusinessProfile>('/businesses/me/logo'),
  /**
   * The logo as a data URL, for the settings preview.
   *
   * `logoUrl` cannot serve that screen: it is a public address that only exists once the
   * booking page is published, so a provider still setting things up would see nothing.
   */
  myLogo: () => api.get<{ dataUrl: string }>('/businesses/me/logo'),
};
