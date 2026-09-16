import { type FormEvent, useEffect, useState } from 'react';
import { Badge, Button, Dialog } from '@/components/atoms';
import { FormField, SelectField, TextareaField } from '@/components/molecules';
import { type LedgerEntry, PAYMENT_METHODS, type PaymentMethod } from '@/lib/api';
import { amountToCents, centsToAmount, formatDate, formatMoney } from '@/lib/utils';
import { usePaymentStore } from '@/stores';

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LedgerEntry;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  mbway: 'MB Way',
  card: 'Card',
  transfer: 'Bank transfer',
  other: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
};

export function PaymentDialog({ open, onOpenChange, entry }: PaymentDialogProps) {
  const create = usePaymentStore((state) => state.create);
  const update = usePaymentStore((state) => state.update);
  const remove = usePaymentStore((state) => state.remove);
  const status = usePaymentStore((state) => state.status);
  const error = usePaymentStore((state) => state.error);
  const clearError = usePaymentStore((state) => state.clearError);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('mbway');
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState('');
  const [amountError, setAmountError] = useState<string>();

  // Prefilled with what is still owed: the common case is settling the balance in one go.
  useEffect(() => {
    if (open) {
      setAmount(centsToAmount(entry.outstandingCents || entry.priceCents));
      setMethod('mbway');
      setPending(false);
      setNotes('');
      setAmountError(undefined);
      clearError();
    }
  }, [open, entry, clearError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amountCents = amountToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setAmountError('Use an amount like 18 or 18.50');
      return;
    }
    setAmountError(undefined);

    const ok = await create({
      bookingId: entry.bookingId,
      amountCents,
      method,
      status: pending ? 'pending' : 'paid',
      notes: notes.trim() || undefined,
    });
    if (ok) onOpenChange(false);
  }

  const busy = status === 'saving';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Payments — ${entry.client}`}
      description={`${entry.service} · ${formatDate(entry.startsAt)} · ${formatMoney(entry.priceCents)}`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button type="submit" form="payment-form" loading={busy}>
            Record payment
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {entry.payments.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-brand-900">Recorded so far</h3>
            <ul className="flex flex-col divide-y divide-hairline/70 rounded-xl bg-surface/50 px-3 ring-1 ring-hairline">
              {entry.payments.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 py-2">
                  <span className="w-20 shrink-0 tabular-nums text-sm text-brand-900">
                    {formatMoney(payment.amountCents)}
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {METHOD_LABELS[payment.method]}
                  </span>
                  <Badge
                    variant={
                      payment.status === 'paid'
                        ? 'brand'
                        : payment.status === 'pending'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {STATUS_LABELS[payment.status]}
                  </Badge>
                  <span className="ml-auto flex shrink-0 gap-1">
                    {payment.status === 'pending' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void update(payment.id, { status: 'paid' })}
                      >
                        Mark paid
                      </Button>
                    ) : null}
                    {payment.status === 'paid' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void update(payment.id, { status: 'refunded' })}
                      >
                        Refund
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-700 hover:bg-red-600/8 hover:text-red-800"
                      disabled={busy}
                      onClick={() => void remove(payment.id)}
                    >
                      Delete
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-muted">
              {formatMoney(entry.paidCents)} collected ·{' '}
              {entry.outstandingCents > 0
                ? `${formatMoney(entry.outstandingCents)} still owed`
                : 'nothing owed'}
            </p>
          </section>
        ) : null}

        <form id="payment-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Amount"
              required
              inputMode="decimal"
              hint="Euros."
              error={amountError}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <SelectField
              label="Method"
              options={PAYMENT_METHODS.map((value) => ({
                value,
                label: METHOD_LABELS[value],
              }))}
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface/50 px-3 py-3 ring-1 ring-hairline">
            <input
              type="checkbox"
              className="size-4 accent-brand-700"
              checked={pending}
              onChange={(event) => setPending(event.target.checked)}
            />
            <span>
              <span className="text-sm font-medium text-brand-900">Not collected yet</span>
              <span className="block text-xs text-ink-muted">
                Records it as pending — it will not count as collected until you mark it paid.
              </span>
            </span>
          </label>

          <TextareaField
            label="Notes"
            hint="Optional."
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {error ? (
            <p role="alert" className="rounded-lg bg-red-600/8 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </Dialog>
  );
}
