import { type FormEvent, useEffect, useState } from 'react';
import { Badge, Button, Dialog } from '@/components/atoms';
import { FormField, SelectField, TextareaField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { type LedgerEntry, PAYMENT_METHODS, type PaymentMethod } from '@/lib/api';
import { amountToCents, centsToAmount, formatDate, formatMoney } from '@/lib/utils';
import { usePaymentStore } from '@/stores';

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LedgerEntry;
}

export function PaymentDialog({ open, onOpenChange, entry }: PaymentDialogProps) {
  const copy = useCopy();
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
      setAmountError(copy.payments.errorAmount);
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
      title={copy.payments.dialogTitleFor(entry.client)}
      description={`${entry.service} · ${formatDate(entry.startsAt)} · ${formatMoney(entry.priceCents)}`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            {copy.common.close}
          </Button>
          <Button type="submit" form="payment-form" loading={busy}>
            {copy.payments.dialogTitle}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {entry.payments.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-brand-900">{copy.payments.recordedSoFar}</h3>
            <ul className="flex flex-col divide-y divide-hairline/70 rounded-xl bg-sheet/50 px-3 ring-1 ring-hairline">
              {entry.payments.map((payment) => (
                <li key={payment.id} className="flex items-center gap-3 py-2">
                  <span className="w-20 shrink-0 tabular-nums text-sm text-brand-900">
                    {formatMoney(payment.amountCents)}
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {copy.payments.methods[payment.method]}
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
                    {copy.payments.paymentStatus[payment.status]}
                  </Badge>
                  <span className="ml-auto flex shrink-0 gap-1">
                    {payment.status === 'pending' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void update(payment.id, { status: 'paid' })}
                      >
                        {copy.payments.markPaid}
                      </Button>
                    ) : null}
                    {payment.status === 'paid' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void update(payment.id, { status: 'refunded' })}
                      >
                        {copy.payments.refund}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-ink hover:bg-danger/8 hover:text-danger-ink"
                      disabled={busy}
                      onClick={() => void remove(payment.id)}
                    >
                      {copy.common.delete}
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
              label={copy.common.amount}
              required
              inputMode="decimal"
              hint={copy.common.euros}
              error={amountError}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <SelectField
              label={copy.payments.method}
              options={PAYMENT_METHODS.map((value) => ({
                value,
                label: copy.payments.methods[value],
              }))}
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
            <input
              type="checkbox"
              className="size-4 accent-brand-700"
              checked={pending}
              onChange={(event) => setPending(event.target.checked)}
            />
            <span>
              <span className="text-sm font-medium text-brand-900">
                {copy.payments.notCollectedYet}
              </span>
              <span className="block text-xs text-ink-muted">{copy.payments.pendingExplainer}</span>
            </span>
          </label>

          <TextareaField
            label={copy.common.notes}
            hint={copy.common.optional}
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          {error ? (
            <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </Dialog>
  );
}
