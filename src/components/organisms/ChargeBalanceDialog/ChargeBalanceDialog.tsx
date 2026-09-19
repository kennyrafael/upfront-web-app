import { useEffect, useState } from 'react';
import { Button, Dialog, Spinner } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { ApiError, type Booking, type BookingBalance, bookingsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

export interface ChargeBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking;
}

const toEuros = (cents: number) => (cents / 100).toFixed(2);
const toCents = (euros: string) => Math.round(Number(euros.replace(',', '.')) * 100);

/**
 * Asking the client for what is still owed, while they are still standing there.
 *
 * Opened straight off "mark completed" rather than from a menu, because that is the only
 * moment it works: a request sent after they have left is a support ticket, not a payment.
 *
 * It does not pretend to know the answer. The push goes to a phone, the client taps approve
 * or does not, and this shows what is waiting until a webhook says otherwise — refreshing on
 * demand rather than polling, because nobody wants a dialog that flickers while they talk.
 */
export function ChargeBalanceDialog({ open, onOpenChange, booking }: ChargeBalanceDialogProps) {
  const copy = useCopy();
  const [state, setState] = useState<BookingBalance>();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();

  useEffect(() => {
    if (!open || !booking) return;

    setError(undefined);
    setSentTo(undefined);
    void (async () => {
      try {
        const next = await bookingsApi.balance(booking.id);
        setState(next);
        setAmount(toEuros(next.pending?.amountCents ?? next.outstandingCents));
        setPhone(next.clientPhone ?? '');
      } catch (problem) {
        setError(problem instanceof ApiError ? problem.message : copy.balance.errorRead);
      }
    })();
  }, [open, booking]);

  async function refresh() {
    if (!booking) return;
    setState(await bookingsApi.balance(booking.id));
  }

  async function send() {
    if (!booking) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await bookingsApi.chargeBalance(booking.id, {
        amountCents: toCents(amount),
        phone: phone.trim() || undefined,
      });
      setSentTo(result.phone);
      await refresh();
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : copy.balance.errorSend);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!booking) return;
    setBusy(true);
    setError(undefined);
    try {
      await bookingsApi.cancelBalance(booking.id);
      setSentTo(undefined);
      await refresh();
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : copy.balance.errorWithdraw);
    } finally {
      setBusy(false);
    }
  }

  const settled = state && state.outstandingCents === 0 && !state.pending;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.balance.title}
      description={
        booking ? `${booking.client.name} · ${formatMoney(booking.priceCents)} total` : undefined
      }
      footer={
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          {copy.common.done}
        </Button>
      }
    >
      {!state ? (
        <div className="flex items-center gap-2 text-ink-muted text-sm">
          <Spinner className="size-4 text-brand-ink" /> {copy.balance.checking}
        </div>
      ) : settled ? (
        <p className="rounded-lg bg-brand-700/10 px-3 py-2 text-brand-900 text-sm">
          {copy.balance.paidInFull}
        </p>
      ) : state.pending ? (
        /* Waiting. The number is repeated because the business read it out a moment ago and
           is now watching a phone that has not buzzed — "which number did it go to" is the
           first thing they ask. */
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-warn/12 px-3 py-2 text-sm text-warn-ink">
            {copy.balance.waitingFor(
              booking?.client.name ?? '',
              formatMoney(state.pending.amountCents),
            )}
            {sentTo ? copy.balance.waitingOn(sentTo) : ''}.
          </p>
          <p className="text-ink-muted text-sm">{copy.balance.pushExplainer}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
              {copy.balance.checkAgain}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={busy}
              onClick={() => void withdraw()}
            >
              {copy.balance.withdraw}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-ink-muted text-sm">
            {copy.balance.collectedOf(formatMoney(state.paidCents), formatMoney(state.priceCents))}{' '}
            <strong className="text-ink">
              {copy.balance.stillOwed(formatMoney(state.outstandingCents))}
            </strong>
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label={copy.common.amount}
              inputMode="decimal"
              hint={copy.balance.amountHint}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <FormField
              label={copy.balance.toThisNumber}
              type="tel"
              hint={copy.balance.readItBack}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div>
            <Button type="button" loading={busy} onClick={() => void send()}>
              {copy.balance.sendRequest}
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-danger/8 px-3 py-2 text-danger-ink text-sm">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
