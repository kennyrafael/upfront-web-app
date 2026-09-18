import { Badge, Button, Card, Spinner } from '@/components/atoms';
import type { LedgerEntry, SettlementState } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { usePaymentStore } from '@/stores';

export interface PaymentLedgerProps {
  onRecord: (entry: LedgerEntry) => void;
}

const STATE_BADGE: Record<
  SettlementState,
  { variant: 'brand' | 'neutral' | 'warning' | 'danger'; label: string }
> = {
  unpaid: { variant: 'danger', label: 'Unpaid' },
  partial: { variant: 'warning', label: 'Part-paid' },
  paid: { variant: 'brand', label: 'Paid' },
  overpaid: { variant: 'neutral', label: 'Overpaid' },
};

export function PaymentLedger({ onRecord }: PaymentLedgerProps) {
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
        <Spinner className="text-brand-ink" /> Loading the ledger…
      </Card>
    );
  }

  if (visible.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">
          {entries.length === 0
            ? 'Nothing to settle yet'
            : filter === 'owing'
              ? 'Everything is settled'
              : 'Nothing settled yet'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          {entries.length === 0
            ? 'Bookings appear here as soon as you have any. Record what you collect against them.'
            : 'Try another filter.'}
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
              <th className="px-5 py-3 font-medium">Booking</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
              <th className="px-5 py-3 text-right font-medium">Paid</th>
              <th className="px-5 py-3 text-right font-medium">Outstanding</th>
              <th className="px-5 py-3 font-medium">Status</th>
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
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => onRecord(entry)}>
                        {entry.payments.length > 0 ? 'Payments' : 'Record'}
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
