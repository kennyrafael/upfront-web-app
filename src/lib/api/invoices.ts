import { api } from './client';
import type { Page } from './pagination';

export const INVOICE_STATUSES = ['draft', 'issued', 'cancelled'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceLine {
  bookingId: string;
  description: string;
  performedAt: string;
  priceCents: number;
}

export interface Invoice {
  id: string;
  number?: string;
  status: InvoiceStatus;
  issueDate: string;
  client: { id: string; name: string; email?: string };
  lines: InvoiceLine[];
  subtotalCents: number;
  vatRate: number;
  vatCents: number;
  totalCents: number;
  vatExemptionReason?: string;
}

export interface CreateInvoicePayload {
  clientId: string;
  bookingIds: string[];
  issueDate?: string;
  vatRate?: number;
  vatExemptionReason?: string;
}

export type UpdateInvoicePayload = Partial<CreateInvoicePayload>;

export const invoicesApi = {
  list: (year: number, paging?: { page?: number; pageSize?: number }) =>
    api.get<Page<Invoice>>(
      `/invoices?year=${year}${paging?.page ? `&page=${paging.page}` : ''}${
        paging?.pageSize ? `&pageSize=${paging.pageSize}` : ''
      }`,
    ),
  create: (payload: CreateInvoicePayload) => api.post<Invoice>('/invoices', payload),
  update: (id: string, payload: UpdateInvoicePayload) =>
    api.patch<Invoice>(`/invoices/${id}`, payload),
  issue: (id: string) => api.post<Invoice>(`/invoices/${id}/issue`),
  cancel: (id: string) => api.post<Invoice>(`/invoices/${id}/cancel`),
  remove: (id: string) => api.delete<void>(`/invoices/${id}`),
  billedBookingIds: () => api.get<string[]>('/invoices/billed-bookings'),
  /** The browser sandbox blocks script-driven downloads, so this returns the text. */
  exportCsv: (year: number) => api.text(`/invoices/export?year=${year}`),
};
