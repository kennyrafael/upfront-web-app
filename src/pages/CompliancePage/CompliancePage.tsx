import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  ComplianceOverview,
  DashboardLayout,
  InvoiceFormDialog,
  InvoiceTable,
  ReciboPreview,
  Select,
  Spinner,
} from '@/components';
import { useCopy } from '@/lib';
import type { Invoice } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useBusinessStore, useComplianceStore } from '@/stores';
import { exportPeriodOptions, exportPeriodValue, parseExportPeriod } from './exportPeriod';

/** The current year and the four before it — enough for any open fiscal question. */
function yearOptions(): { value: string; label: string }[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, index) => {
    const year = current - index;
    return { value: String(year), label: String(year) };
  });
}

export function CompliancePage() {
  const copy = useCopy();
  const load = useComplianceStore((state) => state.load);
  const year = useComplianceStore((state) => state.year);
  const setYear = useComplianceStore((state) => state.setYear);
  const summary = useComplianceStore((state) => state.summary);
  const status = useComplianceStore((state) => state.status);
  const error = useComplianceStore((state) => state.error);
  const exportCsv = useComplianceStore((state) => state.exportCsv);
  const exportZip = useComplianceStore((state) => state.exportZip);
  const exportReconciliation = useComplianceStore((state) => state.exportReconciliation);
  const exportQuarter = useComplianceStore((state) => state.exportQuarter);
  const exportMonth = useComplianceStore((state) => state.exportMonth);
  const setExportPeriod = useComplianceStore((state) => state.setExportPeriod);
  const loadProfile = useBusinessStore((state) => state.load);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice>();
  const [previewing, setPreviewing] = useState<Invoice>();
  const [csv, setCsv] = useState<string>();

  /**
   * Hands the archive to the browser.
   *
   * An object URL and a synthetic click, because the endpoint needs an Authorization header
   * and a plain `<a href>` cannot send one. The URL is revoked straight after — it pins the
   * blob in memory until it is, and a quarter of PDFs is not nothing.
   */
  async function download(
    fetching: () => Promise<{ blob: Blob; filename: string } | null>,
  ): Promise<void> {
    const file = await fetching();
    if (!file) return;

    const url = URL.createObjectURL(file.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    void load();
    // The recibo preview prints the provider's own name and NIF.
    void loadProfile();
  }, [load, loadProfile]);

  return (
    <DashboardLayout
      title={copy.compliance.title}
      description={copy.compliance.lede}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={async () => setCsv((await exportCsv()) ?? undefined)}
          >
            {copy.compliance.exportCsv}
          </Button>
          {/*
            The pack: the CSV and every recibo of the period as a PDF. Downloaded rather
            than shown, because unlike the CSV there is nothing to read inline.
          */}
          <Button variant="secondary" onClick={() => void download(exportZip)}>
            {copy.compliance.exportPack}
          </Button>
          {/*
            The other half of the hand-off. The recibos say what was charged; this says what
            reached the bank, and the gap between them is our commission — which no document
            an accountant already has will explain.
          */}
          <Button variant="secondary" onClick={() => void download(exportReconciliation)}>
            {copy.compliance.exportReconciliation}
          </Button>
          <Button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            {copy.compliance.newRecibo}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex w-36 flex-col gap-1.5">
          <Select
            aria-label={copy.compliance.fiscalYear}
            options={yearOptions()}
            value={String(year)}
            onValueChange={(value) => void setYear(Number(value))}
          />
        </div>

        {/*
          Narrows the *export*, not the page. The IVA ceiling is an annual figure and the
          quarter cards below are the year broken down — filtering the view to one quarter
          would hide the number this page exists to show.
        */}
        <div className="flex w-52 flex-col gap-1.5">
          <Select
            aria-label={copy.compliance.exportPeriod}
            options={exportPeriodOptions(copy)}
            value={exportPeriodValue(exportQuarter, exportMonth)}
            onValueChange={(value) => setExportPeriod(parseExportPeriod(value))}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      {summary ? (
        <ComplianceOverview summary={summary} />
      ) : status === 'loading' ? (
        <Card className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
          <Spinner className="text-brand-ink" /> {copy.compliance.loading}
        </Card>
      ) : null}

      <h2 className="mt-8 mb-3 font-medium text-brand-900">Recibos for {year}</h2>

      <InvoiceTable
        onView={(invoice) => {
          if (invoice.status === 'draft') {
            setEditing(invoice);
            setFormOpen(true);
          } else {
            setPreviewing(invoice);
          }
        }}
      />

      {summary ? (
        <p className="mt-4 text-xs text-ink-muted">
          Thresholds and deadlines are a planning aid, not tax advice. Figures last checked{' '}
          {formatDate(summary.reference.lastVerified)} against{' '}
          {summary.reference.sources.join(' and ')}. Confirm before you file — Upfront never files
          anything for you.
        </p>
      ) : null}

      {csv ? (
        <Card className="mt-4">
          <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3">
            <h3 className="font-medium text-brand-900">recibos-{year}.csv</h3>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void navigator.clipboard?.writeText(csv)}
              >
                {copy.compliance.copy}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCsv(undefined)}>
                {copy.compliance.dismiss}
              </Button>
            </div>
          </div>
          {/* Shown inline rather than downloaded: the preview sandbox blocks
              script-driven downloads, and copy-paste into a sheet works everywhere. */}
          <pre className="max-h-64 overflow-auto px-5 py-4 text-xs tabular-nums text-ink">
            {csv}
          </pre>
        </Card>
      ) : null}

      <InvoiceFormDialog open={formOpen} onOpenChange={setFormOpen} invoice={editing} />

      {previewing ? (
        <ReciboPreview
          open={Boolean(previewing)}
          onOpenChange={(open) => !open && setPreviewing(undefined)}
          invoice={previewing}
        />
      ) : null}
    </DashboardLayout>
  );
}
