import { create } from 'zustand';
import {
  ApiError,
  type ComplianceSummary,
  type CreateInvoicePayload,
  complianceApi,
  type ExportPeriod,
  type Invoice,
  invoicesApi,
  MAX_PAGE_SIZE,
  type UpdateInvoicePayload,
} from '@/lib/api';

interface ComplianceState {
  year: number;
  /**
   * Which slice of the year an export covers. Absent means the whole of it.
   *
   * Only on exports, deliberately — the page itself still shows the year, because the IVA
   * ceiling is an annual figure and narrowing the view to a quarter would hide the number
   * the page exists to show.
   */
  exportQuarter?: number;
  exportMonth?: number;
  summary: ComplianceSummary | null;
  invoices: Invoice[];
  /** Bookings already held by a draft or issued recibo. */
  billedBookingIds: string[];
  status: 'idle' | 'loading' | 'saving';
  error: string | null;
  load: () => Promise<void>;
  setYear: (year: number) => Promise<void>;
  create: (payload: CreateInvoicePayload) => Promise<boolean>;
  update: (id: string, payload: UpdateInvoicePayload) => Promise<boolean>;
  issue: (id: string) => Promise<boolean>;
  cancel: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  setExportPeriod: (period: { quarter?: number; month?: number }) => void;
  exportCsv: () => Promise<string | null>;
  exportZip: () => Promise<{ blob: Blob; filename: string } | null>;
  clearError: () => void;
  reset: () => void;
}

function toMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}

export const useComplianceStore = create<ComplianceState>((set, get) => ({
  year: new Date().getFullYear(),
  summary: null,
  invoices: [],
  billedBookingIds: [],
  status: 'idle',
  error: null,

  load: async () => {
    const { year } = get();
    set({ status: 'loading', error: null });
    try {
      // One await for three reads: the page shows them together, so it should not
      // paint the dashboard before the table it explains.
      const [summary, invoices, billedBookingIds] = await Promise.all([
        complianceApi.summary(year),
        invoicesApi.list(year, { pageSize: MAX_PAGE_SIZE }),
        invoicesApi.billedBookingIds(),
      ]);
      set({ summary, invoices: invoices.items, billedBookingIds, status: 'idle' });
    } catch (error) {
      set({ status: 'idle', error: toMessage(error) });
    }
  },

  setYear: async (year) => {
    set({ year });
    await get().load();
  },

  create: async (payload) => run(set, get, () => invoicesApi.create(payload)),
  update: async (id, payload) => run(set, get, () => invoicesApi.update(id, payload)),
  issue: async (id) => run(set, get, () => invoicesApi.issue(id)),
  cancel: async (id) => run(set, get, () => invoicesApi.cancel(id)),
  remove: async (id) => run(set, get, () => invoicesApi.remove(id)),

  setExportPeriod: (period) => set({ exportQuarter: period.quarter, exportMonth: period.month }),

  exportCsv: async () => {
    try {
      return await invoicesApi.exportCsv(periodOf(get()));
    } catch (error) {
      set({ error: toMessage(error) });
      return null;
    }
  },

  exportZip: async () => {
    try {
      const period = periodOf(get());
      return { blob: await invoicesApi.exportZip(period), filename: zipNameFor(period) };
    } catch (error) {
      set({ error: toMessage(error) });
      return null;
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      year: new Date().getFullYear(),
      summary: null,
      invoices: [],
      billedBookingIds: [],
      status: 'idle',
      error: null,
    }),
}));

/**
 * Every write reloads the page data: issuing a recibo moves turnover between buckets,
 * changes the threshold and frees nothing, so patching state in place would drift.
 */
async function run(
  set: (partial: Partial<ComplianceState>) => void,
  get: () => ComplianceState,
  action: () => Promise<unknown>,
): Promise<boolean> {
  set({ status: 'saving', error: null });
  try {
    await action();
    await get().load();
    return true;
  } catch (error) {
    set({ status: 'idle', error: toMessage(error) });
    return false;
  }
}

/** The export period, out of the state that holds it in three separate fields. */
function periodOf(state: {
  year: number;
  exportQuarter?: number;
  exportMonth?: number;
}): ExportPeriod {
  return { year: state.year, quarter: state.exportQuarter, month: state.exportMonth };
}

/**
 * What to call the downloaded archive.
 *
 * Mirrors what the API puts in `Content-Disposition`, because reading that header back out
 * of a `fetch` means parsing a header format with quoting rules for a string we already
 * know. If the two ever disagree the file is still correct — only its name is ours.
 */
function zipNameFor({ year, quarter, month }: ExportPeriod): string {
  if (month) return `recibos-emitidos-${year}-${String(month).padStart(2, '0')}.zip`;
  if (quarter) return `recibos-emitidos-${year}-T${quarter}.zip`;
  return `recibos-emitidos-${year}.zip`;
}
