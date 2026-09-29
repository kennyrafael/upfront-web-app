import { api } from './client';

export interface WorkingHours {
  /** 0 = Sunday, matching JS `Date#getDay`. */
  weekday: number;
  start: string;
  end: string;
}

/**
 * How finely the day divides, in minutes. Mirrors `SLOT_MINUTES_CHOICES` on the API.
 *
 * All of them divide an hour, so the grid lines up with the clock — 25 would put a row at
 * 10:25 under a heading that says 10:00.
 */
export const SLOT_MINUTES_CHOICES = [5, 10, 15, 20, 30, 60] as const;

/**
 * Whether the business *is* a person or is a company. Mirrors `ENTITY_TYPES` on the API.
 *
 * Decides which identity checks the payment gateway runs and which tax id it wants. It will
 * also decide whether compliance issues a recibo verde or a fatura, once that is built.
 */
export const ENTITY_TYPES = ['individual', 'company'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/**
 * What the shop does. Mirrors `BUSINESS_CATEGORIES` on the API.
 *
 * Asked because the payment gateway requires a merchant category code and will not accept
 * "a service business". The four-digit code is the API's business, not the provider's.
 */
export const BUSINESS_CATEGORIES = ['beauty', 'fitness', 'home_services', 'other'] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

/** The person the gateway checks against public records. */
export interface Representative {
  firstName: string;
  lastName: string;
  /** `YYYY-MM-DD`. A plain date — a birthday has no time and no zone to shift it. */
  birthDate: string;
}

/** The business's own address — the one on a recibo, and the one the gateway checks. */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country?: string;
}

/** The shop. The person signing in is `AuthenticatedUser` — they stopped being one record. */
export interface BusinessProfile {
  id: string;
  name: string;
  /** The registered entity name, when the shop trades under a different one. */
  legalName?: string;
  phone?: string;
  nif?: string;
  entityType: EntityType;
  businessCategory?: BusinessCategory;
  address?: Address;
  representative?: Representative;
  /** Where they are paid out. Absent until payments are set up. */
  payoutIban?: string;
  /** A site describing the business. Absent means their own booking page is used. */
  websiteUrl?: string;
  timezone: string;
  onboardedAt?: string;
  /** When the shop is open. A ceiling: availability is this intersected with a person's own. */
  hours: WorkingHours[];
  /** The grid: the rows of the calendar and the starts offered to clients. */
  slotMinutes: number;
  slug?: string;
  publicBookingEnabled: boolean;
  autoConfirmPublicBookings: boolean;
  bookingLeadTimeHours: number;
  bookingHorizonDays: number;
  depositPercent: number;
  /** What a client pays at booking: nothing, a deposit, or the whole price. */
  paymentMode: 'none' | 'deposit' | 'full';
  cancellationNoticeHours: number;
  /** `#RRGGBB`. Absent means Upfront's own green. */
  brandColor?: string;
  /** The public, versioned address of the logo. Absent until one is uploaded *and* a slug exists. */
  logoUrl?: string;
}

export interface UpdateBusinessPayload {
  name?: string;
  legalName?: string;
  phone?: string;
  nif?: string;
  entityType?: EntityType;
  businessCategory?: BusinessCategory;
  address?: Address;
  representative?: Representative;
  payoutIban?: string;
  websiteUrl?: string;
  timezone?: string;
  hours?: WorkingHours[];
  slotMinutes?: number;
  slug?: string;
  publicBookingEnabled?: boolean;
  autoConfirmPublicBookings?: boolean;
  bookingLeadTimeHours?: number;
  bookingHorizonDays?: number;
  cancellationNoticeHours?: number;
  depositPercent?: number;
  paymentMode?: 'none' | 'deposit' | 'full';
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
