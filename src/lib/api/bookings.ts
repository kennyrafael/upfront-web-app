import { api } from './client';

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

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
  list: ({ from, to }: BookingRange) =>
    api.get<Booking[]>(`/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  /** Every booking for one client, for building a recibo from past work. */
  listByClient: (clientId: string) =>
    api.get<Booking[]>(`/bookings?clientId=${encodeURIComponent(clientId)}`),
  create: (payload: CreateBookingPayload) => api.post<Booking>('/bookings', payload),
  update: (id: string, payload: UpdateBookingPayload) =>
    api.patch<Booking>(`/bookings/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/bookings/${id}`),
};
