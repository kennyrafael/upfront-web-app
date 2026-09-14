import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DashboardLayout,
  PaymentDialog,
  PaymentLedger,
} from '@/components';
import type { LedgerEntry, PaymentMethod } from '@/lib/api';
import { cn, formatMoney } from '@/lib/utils';
import { type LedgerFilter, usePaymentStore } from '@/stores';

const FILTERS: { value: LedgerFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'owing', label: 'Owing' },
  { value: 'settled', label: 'Settled' },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  mbway: 'MB Way',
  card: 'Card',
  transfer: 'Transfer',
  other: 'Other',
};

export function PaymentsPage() {
  const load = usePaymentStore((state) => state.load);
  const summary = usePaymentStore((state) => state.summary);
  const filter = usePaymentStore((state) => state.filter);
  const setFilter = usePaymentStore((state) => state.setFilter);
  const error = usePaymentStore((state) => state.error);

  const entries = usePaymentStore((state) => state.entries);
  const [selected, setSelected] = useState<LedgerEntry>();

  useEffect(() => {
    void load();
  }, [load]);

  // Every write reloads the ledger, so track the open row by id rather than holding the
  // snapshot taken when the dialog opened — otherwise it shows stale totals.
  const current = selected
    ? (entries.find((entry) => entry.bookingId === selected.bookingId) ?? selected)
    : undefined;

  return (
    <DashboardLayout
      title="Payments"
      description="What you have collected, and what is still owed."
    >
      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Collected</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold tabular-nums text-brand-900">
                {formatMoney(summary.collectedCents)}
              </p>
              {summary.byMethod.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {summary.byMethod.map((bucket) => (
                    <li key={bucket.method}>
                      {METHOD_LABELS[bucket.method]} {formatMoney(bucket.collectedCents)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold tabular-nums text-brand-900">
                {formatMoney(summary.outstanding.totalCents)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                across {summary.outstanding.count} booking
                {summary.outstanding.count === 1 ? '' : 's'}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold tabular-nums text-brand-900">
                {formatMoney(summary.pendingCents)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Recorded but not collected — a transfer on its way, say.
              </p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <div className="mt-6 mb-4 flex gap-1">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? 'primary' : 'secondary'}
            size="sm"
            className={cn(filter !== option.value && 'text-ink-muted')}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-600/8 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <PaymentLedger onRecord={setSelected} />

      {current ? (
        <PaymentDialog
          open={Boolean(current)}
          onOpenChange={(open) => !open && setSelected(undefined)}
          entry={current}
        />
      ) : null}
    </DashboardLayout>
  );
}
