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

export interface Booking {
  id: string;
  client: { id: string; name: string; phone?: string };
  service: { id: string; name: string; durationMinutes: number };
  /** ISO instants. */
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  priceCents: number;
  notes?: string;
  /** 'public' means the client booked it themselves, unattended. */
  source: 'provider' | 'public';
}

export interface CreateBookingPayload {
  clientId: string;
  serviceId: string;
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

export const bookingsApi = {
  /**
   * A week for the calendar. Asks for the maximum on purpose: the grid has no second page,
   * so a truncated response would silently leave appointments off a provider's screen.
   */
  list: ({ from, to }: BookingRange) =>
    api.get<Page<Booking>>(
      `/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&pageSize=${MAX_PAGE_SIZE}`,
    ),
  /** Every booking for one client, for building a recibo from past work. */
  listByClient: (clientId: string) =>
    api.get<Page<Booking>>(
      `/bookings?clientId=${encodeURIComponent(clientId)}&pageSize=${MAX_PAGE_SIZE}`,
    ),
  create: (payload: CreateBookingPayload) => api.post<Booking>('/bookings', payload),
  update: (id: string, payload: UpdateBookingPayload) =>
    api.patch<Booking>(`/bookings/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/bookings/${id}`),
};
