import { api } from './client';

export const PAYMENT_METHODS = ['cash', 'mbway', 'card', 'transfer', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * `failed` and `expired` only ever come from a gateway — a provider cannot type them in.
 * They are listed so the ledger can render a status it did not create.
 */
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed', 'expired'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** What a provider can record by hand. The rest arrive through the payment gateway. */
export const RECORDABLE_STATUSES = ['pending', 'paid', 'refunded'] as const;

export const PAYMENT_KINDS = ['manual', 'deposit', 'balance'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export type SettlementState = 'unpaid' | 'partial' | 'paid' | 'overpaid';

export interface Payment {
  id: string;
  bookingId: string;
  /** Gross — what the client was charged. */
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  kind: PaymentKind;
  gatewayFeeCents: number;
  platformFeeCents: number;
  /** What the provider receives. Equals `amountCents` for anything recorded by hand. */
  providerNetCents: number;
  paidAt?: string;
  notes?: string;
}

export interface LedgerEntry {
  bookingId: string;
  client: string;
  service: string;
  startsAt: string;
  bookingStatus: string;
  priceCents: number;
  paidCents: number;
  /** What reaches the provider out of `paidCents`, after the gateway's cut and Upfront's. */
  netCents: number;
  feesCents: number;
  pendingCents: number;
  outstandingCents: number;
  state: SettlementState;
  payments: Payment[];
}

export interface PaymentsSummary {
  collectedCents: number;
  netCents: number;
  feesCents: number;
  pendingCents: number;
  outstanding: { count: number; totalCents: number };
  byMethod: { method: PaymentMethod; collectedCents: number; count: number }[];
}

export interface CreatePaymentPayload {
  bookingId: string;
  amountCents: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  paidAt?: string;
  notes?: string;
}

export type UpdatePaymentPayload = Partial<Omit<CreatePaymentPayload, 'bookingId'>>;

export interface PaymentRange {
  from?: string;
  to?: string;
}

function range({ from, to }: PaymentRange): string {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const paymentsApi = {
  ledger: (period: PaymentRange = {}) => api.get<LedgerEntry[]>(`/payments/ledger${range(period)}`),
  summary: (period: PaymentRange = {}) =>
    api.get<PaymentsSummary>(`/payments/summary${range(period)}`),
  create: (payload: CreatePaymentPayload) => api.post<Payment>('/payments', payload),
  update: (id: string, payload: UpdatePaymentPayload) =>
    api.patch<Payment>(`/payments/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/payments/${id}`),
};

/**
 * Where the business has got to in connecting a payments account.
 *
 * Three states rather than a boolean, because the middle one is real and lasts: identity
 * checks can take a day, and a business sitting in it needs to be told that rather than
 * shown a page that looks finished.
 */
export type PaymentsState = 'not_connected' | 'pending' | 'active';

export interface ConnectStatus {
  state: PaymentsState;
  accountId?: string;
  /** Whether they can take money yet. */
  chargesEnabled: boolean;
  /** Whether we can send them any — verified bank details, in practice. */
  payoutsEnabled: boolean;
  /** The gateway's own field names for what is outstanding. Support detail, not copy. */
  requirementsDue: string[];
  /**
   * Business details we still need, in our own field names.
   *
   * **Nothing from Stripe may be mounted while this is non-empty.** Every embedded component
   * fetches a session as it mounts, the API refuses to open one until these are filled in,
   * and Stripe turns that refusal into "An error occurred while authenticating your account"
   * — a message that names neither the cause nor the cure, and is not ours to reword.
   */
  detailsMissing: string[];
}

export const connectApi = {
  /** Creates the account on first call, then hands back a secret for the onboarding UI. */
  session: () => api.post<{ accountId: string; clientSecret: string }>('/payments/connect/session'),
  status: () => api.get<ConnectStatus>('/payments/connect/status'),
};
