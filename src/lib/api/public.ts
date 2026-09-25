import { ApiError } from './client';

export interface PublicService {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  /** Who does this one, so the person step offers nobody who cannot take it. */
  employeeIds: string[];
  /** The heading it groups under. Absent means it shows under "Outros". */
  categoryId?: string;
}

/** One bookable start, and everybody who could take it. */
export interface PublicSlot {
  startsAt: string;
  /** Always at least one. Lets the page grey out a time the chosen person cannot do. */
  employeeIds: string[];
}

/** Somebody a client can ask for by name. */
export interface PublicPerson {
  id: string;
  name: string;
}
export interface PublicProvider {
  slug: string;
  businessName: string;
  /** The provider's own timezone. Every slot on the page is rendered in it. */
  timezone: string;
  /** The provider's own headings, in their own order. Empty when they use none. */
  categories: { id: string; name: string }[];
  services: PublicService[];
  /** Who works here. Empty for a one-person shop, where asking "who with?" has one answer. */
  people: PublicPerson[];
  leadTimeHours: number;
  horizonDays: number;
  /** 0 when this provider takes no deposit. Shown before a client commits to anything. */
  depositPercent: number;
  /** How the provider dressed the page. Absent means Upfront's own colours and their name. */
  brandColor?: string;
  logoUrl?: string;
}

export type DepositStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'expired';

export interface PublicDeposit {
  amountCents: number;
  status: DepositStatus;
  expiresAt?: string;
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
  /** Absent unless a deposit was asked for. */
  deposit?: PublicDeposit;
  /** For the reschedule picker, which reuses the ordinary availability endpoint. */
  slug: string;
  /** Everything on the appointment, so a move asks for times that fit all of it. */
  serviceIds: string[];
  /** Whose it is. The picker narrows to them, because a move keeps the same hands. */
  employeeId?: string;
  /** False once the notice period has gone — at which point cancelling costs the deposit. */
  reschedulable: boolean;
  noticeHours: number;
  /** The whole appointment, which is more than one service once a provider has added to it. */
  durationMinutes: number;
  /** The same dressing as the booking page, so the manage link does not look like another site. */
  brandColor?: string;
  logoUrl?: string;
}

export interface CreatePublicBookingPayload {
  /** Everything the client is booking in one visit. */
  serviceIds: string[];
  /** Who the client asked for. Absent means anyone, which is a real answer. */
  employeeId?: string;
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
  /** Present exactly when `nextStep` is `payment_required`. */
  deposit?: {
    amountCents: number;
    expiresAt: string;
    /**
     * What the browser confirms the payment with.
     *
     * MB WAY approval happens in the client's own app, and Stripe has no documented way to
     * start that from a server — so the page does it. Given once, on this response, and
     * never fetched again: it is a bearer credential for this one payment.
     */
    clientSecret?: string;
  };
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

  availability: (
    slug: string,
    /** Everything being booked. The server needs one gap long enough for all of it. */
    serviceIds: string[],
    from: string,
    to: string,
    /** Overrides the services' own length, for a booking that has grown past it. */
    durationMinutes?: number,
    /** Narrows to one person, when the client asked for somebody in particular. */
    employeeId?: string,
  ) =>
    publicRequest<PublicSlot[]>(
      `/providers/${encodeURIComponent(slug)}/availability?serviceIds=${serviceIds.join(',')}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${
        durationMinutes ? `&durationMinutes=${durationMinutes}` : ''
      }${employeeId ? `&employeeId=${employeeId}` : ''}`,
    ),

  book: (slug: string, payload: CreatePublicBookingPayload) =>
    publicRequest<CreatePublicBookingResult>(`/providers/${encodeURIComponent(slug)}/bookings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  booking: (token: string) =>
    publicRequest<PublicBooking>(`/bookings/${encodeURIComponent(token)}`),

  reschedule: (token: string, startsAt: string) =>
    publicRequest<PublicBooking>(`/bookings/${encodeURIComponent(token)}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ startsAt }),
    }),

  cancel: (token: string) =>
    publicRequest<PublicBooking>(`/bookings/${encodeURIComponent(token)}/cancel`, {
      method: 'POST',
    }),
};
