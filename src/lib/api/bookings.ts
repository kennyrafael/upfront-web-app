import { api } from './client';
import { MAX_PAGE_SIZE, type Page } from './pagination';

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  /**
   * A slot held for a deposit nobody paid. Set by the server only — never something a
   * provider chooses — and kept off the calendar, because nobody ever had this appointment.
   */
  'expired',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** What a provider may set by hand. `expired` is the server's to give, not theirs. */
export const SETTABLE_BOOKING_STATUSES = BOOKING_STATUSES.filter((status) => status !== 'expired');

/** One stretch of a service: minutes, and whether the person is held by them. */
export interface ServiceSegment {
  minutes: number;
  busy: boolean;
}

export interface BookingItem {
  /** The catalog entry it came from, for preselecting it in the edit form. */
  serviceId: string;
  /** Who performs this line. Per item, because one visit can be two people. */
  employeeId: string;
  /** Snapshotted when the booking was made, so a renamed service cannot rewrite history. */
  name: string;
  priceCents: number;
  durationMinutes: number;
  /** The stretches this holds the person for. Absent means all of it. */
  segments?: ServiceSegment[];
}

export interface Booking {
  id: string;
  client: { id: string; name: string; phone?: string };
  /** One or more, in the order they happen. `priceCents` below is their total. */
  items: BookingItem[];
  /** ISO instants. */
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  priceCents: number;
  notes?: string;
  /** 'public' means the client booked it themselves, unattended. */
  source: 'provider' | 'public';
  /** Present when this is one of a repeating set. The id groups them; nothing else. */
  seriesId?: string;
}

export interface CreateBookingPayload {
  clientId: string;
  /** Sent whole on an update too, so adding and removing a service are the same request. */
  serviceIds: string[];
  /**
   * Who performs it. Absent means whoever is booking, or — for a business with one person,
   * which is most of them — that person.
   */
  employeeId?: string;
  startsAt: string;
  status?: BookingStatus;
  notes?: string;
  /** Overrides the working-hours check. Overlaps are never overridable. */
  allowOutsideHours?: boolean;
}

export type UpdateBookingPayload = Partial<CreateBookingPayload>;

export interface BookingRange {
  from: string;
  to: string;
}

/** One cell of the month grid: how full a day is, and a glimpse of it. */
export interface DaySummary {
  /** `YYYY-MM-DD`, already in the shop's timezone — compare it, do not re-parse it. */
  day: string;
  count: number;
  /** The first few of the day, in order. `count` carries the rest. */
  first: { startsAt: string; status: BookingStatus }[];
}

/** "Corte de cabelo + Barba" — how an appointment's services read in one line. */
export function describeBooking(booking: { items: { name: string }[] }): string {
  return booking.items.map((item) => item.name).join(' + ') || 'Service';
}

export const bookingsApi = {
  /**
   * A week for the calendar. Asks for the maximum on purpose: the grid has no second page,
   * so a truncated response would silently leave appointments off a provider's screen.
   */
  list: ({ from, to }: BookingRange) =>
    api.get<Page<Booking>>(
      `/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&pageSize=${MAX_PAGE_SIZE}`,
    ),
  /**
   * One row per day, for the month grid.
   *
   * A summary rather than the bookings: a busy shop has more in a month than the list
   * endpoint will return, so a month built on `list` would be quietly incomplete.
   */
  month: ({ from, to }: BookingRange) =>
    api.get<DaySummary[]>(
      `/bookings/month?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  /** Every booking for one client, for building a recibo from past work. */
  listByClient: (clientId: string) =>
    api.get<Page<Booking>>(
      `/bookings?clientId=${encodeURIComponent(clientId)}&pageSize=${MAX_PAGE_SIZE}`,
    ),
  create: (payload: CreateBookingPayload) => api.post<Booking>('/bookings', payload),
  createRecurring: (payload: CreateRecurringPayload) =>
    api.post<SeriesResult>('/bookings/recurring', payload),
  update: (id: string, payload: UpdateBookingPayload) =>
    api.patch<Booking>(`/bookings/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/bookings/${id}`),
  /** This occurrence and every later one in its series. Never the earlier ones. */
  removeFollowing: (id: string) => api.delete<void>(`/bookings/${id}?scope=following`),

  /** What is owed, and whether a push is already waiting. Read when the prompt opens. */
  balance: (id: string) => api.get<BookingBalance>(`/bookings/${id}/balance`),

  /**
   * Pushes an MB Way request to the client standing in front of you.
   *
   * Amount and phone both optional: the amount defaults to what is owed, the number to the
   * one on file.
   */
  chargeBalance: (id: string, payload: { amountCents?: number; phone?: string }) =>
    api.post<ChargeBalanceResult>(`/bookings/${id}/charge-balance`, payload),

  /** Withdraws a request still waiting, so the amount can be corrected and resent. */
  cancelBalance: (id: string) =>
    api.delete<{ cancelled: number }>(`/bookings/${id}/charge-balance`),
};

/** What is owed on one booking, and whether a request is already on somebody's phone. */
export interface BookingBalance {
  priceCents: number;
  paidCents: number;
  outstandingCents: number;
  pending?: { paymentId: string; amountCents: number; requestedAt: string };
  /** The number on file, so the form opens with it filled in. */
  clientPhone?: string;
}

export interface ChargeBalanceResult {
  paymentId: string;
  amountCents: number;
  /** Echoed back, so it can be read aloud before the client's phone buzzes. */
  phone: string;
  /**
   * What sends the push, from this browser.
   *
   * MB WAY is approved on the payer's device but has to be started from a page, and here
   * that page belongs to whoever is behind the counter rather than to the client.
   */
  clientSecret?: string;
}

/** Mirrors `RECURRENCE_FREQUENCIES` on the API. */
export const RECURRENCE_FREQUENCIES = ['weekly', 'fortnightly', 'monthly'] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export interface CreateRecurringPayload extends CreateBookingPayload {
  frequency: RecurrenceFrequency;
  /** The last day the series may place an appointment on. Inclusive. */
  until: string;
}

/**
 * What a series actually produced.
 *
 * `skipped` is not an error list — a year of Tuesdays meets a holiday, and the provider
 * needs to see which weeks those were rather than a count that disagrees with their
 * calendar.
 */
export interface SeriesResult {
  created: Booking[];
  skipped: { startsAt: string; reason: string }[];
}
