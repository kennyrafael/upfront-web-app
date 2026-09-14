import { ApiError } from './client';

export interface PublicService {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
}

export interface PublicProvider {
  slug: string;
  businessName: string;
  /** The provider's own timezone. Every slot on the page is rendered in it. */
  timezone: string;
  services: PublicService[];
  leadTimeHours: number;
  horizonDays: number;
}

export interface PublicBooking {
  reference: string;
  status: string;
  serviceName: string;
  businessName: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  clientName: string;
  cancellable: boolean;
}

export interface CreatePublicBookingPayload {
  serviceId: string;
  startsAt: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  /** Honeypot. Left empty by real people; the field is hidden. */
  company?: string;
}

export interface CreatePublicBookingResult {
  reference: string;
  manageToken: string;
  nextStep: 'confirmed' | 'payment_required';
}

/**
 * A separate request path from `lib/api/client.ts` on purpose.
 *
 * The shared client attaches an Authorization header whenever a token happens to be in
 * the store. These endpoints are for strangers, and a provider browsing their own booking
 * page while signed in must not silently send their credentials to a public route.
 */
async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/public${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(await extractMessage(response), response.status);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

async function extractMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const { message } = payload;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  } catch {
    // Non-JSON body; fall through.
  }
  return response.status === 429
    ? 'Too many attempts. Please wait a moment and try again.'
    : `Request failed with status ${response.status}`;
}

export const publicApi = {
  provider: (slug: string) =>
    publicRequest<PublicProvider>(`/providers/${encodeURIComponent(slug)}`),

  availability: (slug: string, serviceId: string, from: string, to: string) =>
    publicRequest<string[]>(
      `/providers/${encodeURIComponent(slug)}/availability?serviceId=${serviceId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),

  book: (slug: string, payload: CreatePublicBookingPayload) =>
    publicRequest<CreatePublicBookingResult>(`/providers/${encodeURIComponent(slug)}/bookings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  booking: (token: string) =>
    publicRequest<PublicBooking>(`/bookings/${encodeURIComponent(token)}`),

  cancel: (token: string) =>
    publicRequest<PublicBooking>(`/bookings/${encodeURIComponent(token)}/cancel`, {
      method: 'POST',
    }),
};
