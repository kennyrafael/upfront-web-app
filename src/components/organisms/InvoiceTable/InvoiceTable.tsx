import { useState } from 'react';
import { Badge, Button, Card, Spinner } from '@/components/atoms';
import { ConfirmDialog } from '@/components/molecules';
import type { Invoice, InvoiceStatus } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { useComplianceStore } from '@/stores';

export interface InvoiceTableProps {
  onView: (invoice: Invoice) => void;
}

const STATUS_BADGE: Record<
  InvoiceStatus,
  { variant: 'brand' | 'neutral' | 'danger'; label: string }
> = {
  draft: { variant: 'neutral', label: 'Draft' },
  issued: { variant: 'brand', label: 'Issued' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

export function InvoiceTable({ onView }: InvoiceTableProps) {
  const invoices = useComplianceStore((state) => state.invoices);
  const status = useComplianceStore((state) => state.status);
  const year = useComplianceStore((state) => state.year);
  const issue = useComplianceStore((state) => state.issue);
  const cancel = useComplianceStore((state) => state.cancel);
  const remove = useComplianceStore((state) => state.remove);

  const [pendingIssue, setPendingIssue] = useState<Invoice>();
  const [pendingCancel, setPendingCancel] = useState<Invoice>();
  const [pendingDelete, setPendingDelete] = useState<Invoice>();

  if (status === 'loading' && invoices.length === 0) {
    return (
      <Card className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
        <Spinner className="text-brand-700" /> Loading recibos…
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">No recibos for {year}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          Draft one from completed bookings. Upfront prepares it for you to file — it never files
          anything itself.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Issue date</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const badge = STATUS_BADGE[invoice.status];
                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-hairline/60 transition-colors last:border-0 hover:bg-brand-700/4"
                  >
                    <td className="px-5 py-3 font-medium tabular-nums text-brand-900">
                      {invoice.number ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-brand-900">{invoice.client.name}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {invoice.lines.length} line{invoice.lines.length === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{formatDate(invoice.issueDate)}</td>
                    <td className="px-5 py-3 font-medium tabular-nums text-brand-900">
                      {formatMoney(invoice.totalCents)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onView(invoice)}>
                          {invoice.status === 'draft' ? 'Edit' : 'View'}
                        </Button>
                        {invoice.status === 'draft' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingIssue(invoice)}
                            >
                              Issue
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingDelete(invoice)}
                            >
                              Delete
                            </Button>
                          </>
                        ) : null}
                        {invoice.status === 'issued' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingCancel(invoice)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingIssue)}
        onOpenChange={(open) => !open && setPendingIssue(undefined)}
        title="Issue this recibo?"
        description="It gets the next number for the year and becomes read-only. To undo it later you cancel it — the number stays used."
        confirmLabel="Issue"
        loading={status === 'saving'}
        onConfirm={async () => {
          if (pendingIssue && (await issue(pendingIssue.id))) setPendingIssue(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        onOpenChange={(open) => !open && setPendingCancel(undefined)}
        title={`Cancel recibo ${pendingCancel?.number ?? ''}?`}
        description="The recibo keeps its number and stops counting towards your turnover. Its bookings become billable again."
        confirmLabel="Cancel recibo"
        cancelLabel="Keep it"
        destructive
        loading={status === 'saving'}
        onConfirm={async () => {
          if (pendingCancel && (await cancel(pendingCancel.id))) setPendingCancel(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(undefined)}
        title="Delete this draft?"
        description="Drafts have no number and leave no trace. Its bookings become billable again."
        confirmLabel="Delete"
        destructive
        loading={status === 'saving'}
        onConfirm={async () => {
          if (pendingDelete && (await remove(pendingDelete.id))) setPendingDelete(undefined);
        }}
      />
    </>
  );
}
