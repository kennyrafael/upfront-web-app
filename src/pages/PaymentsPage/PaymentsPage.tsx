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
import { useCopy } from '@/lib';
import type { LedgerEntry } from '@/lib/api';
import { cn, formatMoney } from '@/lib/utils';
import { type LedgerFilter, usePaymentStore } from '@/stores';

const FILTERS: { value: LedgerFilter; key: 'filterAll' | 'filterOwing' | 'filterSettled' }[] = [
  { value: 'all', key: 'filterAll' },
  { value: 'owing', key: 'filterOwing' },
  { value: 'settled', key: 'filterSettled' },
];

export function PaymentsPage() {
  const copy = useCopy();
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
    <DashboardLayout title={copy.payments.title} description={copy.payments.lede}>
      {summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{copy.payments.collected}</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold tabular-nums text-brand-900">
                {formatMoney(summary.collectedCents)}
              </p>
              {/* Only when a fee was actually taken. A provider who has never used the
                  booking page should not be shown a "yours" line that simply repeats the
                  number above it. */}
              {summary.feesCents > 0 ? (
                <p className="mt-1 text-sm text-ink-muted">
                  <span className="font-medium text-brand-900">
                    {formatMoney(summary.netCents)}
                  </span>{' '}
                  yours, after {formatMoney(summary.feesCents)} in fees
                </p>
              ) : null}
              {summary.byMethod.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {summary.byMethod.map((bucket) => (
                    <li key={bucket.method}>
                      {copy.payments.methods[bucket.method]} {formatMoney(bucket.collectedCents)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.payments.outstanding}</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold tabular-nums text-brand-900">
                {formatMoney(summary.outstanding.totalCents)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {copy.payments.acrossBookings(summary.outstanding.count)}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.payments.pending}</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold tabular-nums text-brand-900">
                {formatMoney(summary.pendingCents)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{copy.payments.pendingHint}</p>
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
            {copy.payments[option.key]}
          </Button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
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
