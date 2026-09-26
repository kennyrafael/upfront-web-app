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
  exportCsv: (period: ExportPeriod) => api.text(`/invoices/export?${periodQuery(period)}`),
  /**
   * The whole hand-off: the CSV and every recibo of the period as a PDF, in one archive.
   *
   * A blob rather than text, because unlike the CSV there is nothing useful to show inline —
   * an accountant wants the file.
   */
  exportZip: (period: ExportPeriod) => api.blob(`/invoices/export.zip?${periodQuery(period)}`),
  /** The recibo as a PDF. Rendered on the server, so it matches what was issued. */
  pdf: (id: string) => api.blob(`/invoices/${id}/pdf`),
};

/**
 * Which period an export covers.
 *
 * A quarter and a month are alternatives, not a pair — the API takes the narrower of the two
 * if both arrive, and the UI never sends both.
 */
export interface ExportPeriod {
  year: number;
  quarter?: number;
  month?: number;
}

function periodQuery({ year, quarter, month }: ExportPeriod): string {
  const params = new URLSearchParams({ year: String(year) });
  if (month) params.set('month', String(month));
  else if (quarter) params.set('quarter', String(quarter));
  return params.toString();
}
