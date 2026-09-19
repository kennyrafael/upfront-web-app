import { useState } from 'react';
import { Badge, Button, Card, Spinner } from '@/components/atoms';
import { ConfirmDialog } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { Invoice, InvoiceStatus } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { useComplianceStore } from '@/stores';

export interface InvoiceTableProps {
  onView: (invoice: Invoice) => void;
}

const STATUS_BADGE: Record<
  InvoiceStatus,
  { variant: 'brand' | 'neutral' | 'danger'; key: 'draft' | 'issued' | 'cancelled' }
> = {
  draft: { variant: 'neutral', key: 'draft' },
  issued: { variant: 'brand', key: 'issued' },
  cancelled: { variant: 'danger', key: 'cancelled' },
};

export function InvoiceTable({ onView }: InvoiceTableProps) {
  const copy = useCopy();
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
        <Spinner className="text-brand-ink" /> {copy.recibos.loading}
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">{copy.recibos.noneFor(year)}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{copy.recibos.noneBody}</p>
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
                <th className="px-5 py-3 font-medium">{copy.recibos.columnNumber}</th>
                <th className="px-5 py-3 font-medium">{copy.bookings.client}</th>
                <th className="px-5 py-3 font-medium">{copy.recibos.issueDate}</th>
                <th className="px-5 py-3 font-medium">{copy.recibos.total}</th>
                <th className="px-5 py-3 font-medium">{copy.common.status}</th>
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
                      <Badge variant={badge.variant}>{copy.recibos.statuses[badge.key]}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="actions-row flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onView(invoice)}>
                          {invoice.status === 'draft' ? copy.common.edit : copy.recibos.view}
                        </Button>
                        {invoice.status === 'draft' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingIssue(invoice)}
                            >
                              {copy.recibos.issue}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPendingDelete(invoice)}
                            >
                              {copy.common.delete}
                            </Button>
                          </>
                        ) : null}
                        {invoice.status === 'issued' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingCancel(invoice)}
                          >
                            {copy.common.cancel}
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
        title={copy.recibos.issueTitle}
        description={copy.recibos.issueBody}
        confirmLabel={copy.recibos.issue}
        loading={status === 'saving'}
        onConfirm={async () => {
          if (pendingIssue && (await issue(pendingIssue.id))) setPendingIssue(undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        onOpenChange={(open) => !open && setPendingCancel(undefined)}
        title={copy.recibos.cancelTitle(pendingCancel?.number ?? '')}
        description={copy.recibos.cancelBody}
        confirmLabel={copy.recibos.cancelRecibo}
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
        title={copy.recibos.deleteTitle}
        description={copy.recibos.deleteBody}
        confirmLabel={copy.common.delete}
        destructive
        loading={status === 'saving'}
        onConfirm={async () => {
          if (pendingDelete && (await remove(pendingDelete.id))) setPendingDelete(undefined);
        }}
      />
    </>
  );
}
