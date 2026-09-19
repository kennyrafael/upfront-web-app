import { Badge, Button, Card, Spinner } from '@/components/atoms';
import { useCopy } from '@/lib';
import type { LedgerEntry, SettlementState } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { usePaymentStore } from '@/stores';

export interface PaymentLedgerProps {
  onRecord: (entry: LedgerEntry) => void;
}

/** Keyed, not labelled: module scope is evaluated once and the language is not fixed. */
const STATE_BADGE: Record<
  SettlementState,
  {
    variant: 'brand' | 'neutral' | 'warning' | 'danger';
    key: 'unpaid' | 'partPaid' | 'paid' | 'overpaid';
  }
> = {
  unpaid: { variant: 'danger', key: 'unpaid' },
  partial: { variant: 'warning', key: 'partPaid' },
  paid: { variant: 'brand', key: 'paid' },
  overpaid: { variant: 'neutral', key: 'overpaid' },
};

export function PaymentLedger({ onRecord }: PaymentLedgerProps) {
  const copy = useCopy();
  const entries = usePaymentStore((state) => state.entries);
  const filter = usePaymentStore((state) => state.filter);
  const status = usePaymentStore((state) => state.status);

  const visible = entries.filter((entry) => {
    if (filter === 'owing') return entry.outstandingCents > 0;
    if (filter === 'settled') return entry.outstandingCents === 0;
    return true;
  });

  if (status === 'loading' && entries.length === 0) {
    return (
      <Card className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
        <Spinner className="text-brand-ink" /> {copy.payments.loading}
      </Card>
    );
  }

  if (visible.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">
          {entries.length === 0
            ? copy.payments.nothingToSettle
            : filter === 'owing'
              ? copy.payments.everythingSettled
              : copy.payments.nothingSettled}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          {entries.length === 0 ? copy.payments.ledgerEmpty : copy.payments.tryAnotherFilter}
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-3xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-5 py-3 font-medium">{copy.payments.columnBooking}</th>
              <th className="px-5 py-3 font-medium">{copy.payments.columnDate}</th>
              <th className="px-5 py-3 text-right font-medium">{copy.common.price}</th>
              <th className="px-5 py-3 text-right font-medium">{copy.payments.columnPaid}</th>
              <th className="px-5 py-3 text-right font-medium">{copy.payments.outstanding}</th>
              <th className="px-5 py-3 font-medium">{copy.common.status}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => {
              const badge = STATE_BADGE[entry.state];
              return (
                <tr
                  key={entry.bookingId}
                  className="border-b border-hairline/60 transition-colors last:border-0 hover:bg-brand-700/4"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-brand-900">{entry.client}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{entry.service}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{formatDate(entry.startsAt)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink-muted">
                    {formatMoney(entry.priceCents)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-brand-900">
                    {formatMoney(entry.paidCents)}
                    {entry.pendingCents > 0 ? (
                      <span className="block text-xs text-warn-ink">
                        +{formatMoney(entry.pendingCents)} pending
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums text-brand-900">
                    {entry.outstandingCents > 0 ? formatMoney(entry.outstandingCents) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={badge.variant}>{copy.payments[badge.key]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => onRecord(entry)}>
                        {entry.payments.length > 0
                          ? copy.payments.seePayments
                          : copy.payments.recordPayment}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
