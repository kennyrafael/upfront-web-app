import { api } from './client';

export const PAYMENT_METHODS = ['cash', 'mbway', 'card', 'transfer', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type SettlementState = 'unpaid' | 'partial' | 'paid' | 'overpaid';

export interface Payment {
  id: string;
  bookingId: string;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
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
  pendingCents: number;
  outstandingCents: number;
  state: SettlementState;
  payments: Payment[];
}

export interface PaymentsSummary {
  collectedCents: number;
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
