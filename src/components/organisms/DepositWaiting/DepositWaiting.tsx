import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from '@/components/atoms';
import { formatMoney } from '@/lib/utils';
import { usePublicBookingStore } from '@/stores';

/** How often to ask the server whether the deposit landed. */
const POLL_MS = 3000;

function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export interface DepositWaitingProps {
  phone: string;
  onStartOver: () => void;
}

/**
 * The screen a client sits on while their MB WAY app asks them to approve the deposit.
 *
 * The page cannot know the payment succeeded on its own — the gateway tells the server, not
 * the browser — so this polls. It also counts down out loud, because the slot really is
 * released when the timer runs out and finding that out silently would be worse.
 */
export function DepositWaiting({ phone, onStartOver }: DepositWaitingProps) {
  const result = usePublicBookingStore((state) => state.result);
  const depositStatus = usePublicBookingStore((state) => state.depositStatus);
  const refreshDeposit = usePublicBookingStore((state) => state.refreshDeposit);

  const expiresAt = result?.deposit?.expiresAt;
  const [remaining, setRemaining] = useState(() => (expiresAt ? secondsLeft(expiresAt) : 0));

  useEffect(() => {
    if (!expiresAt) return;

    const tick = setInterval(() => setRemaining(secondsLeft(expiresAt)), 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  useEffect(() => {
    // Stop asking the moment there is nothing left to wait for. A page left open must not
    // poll a dead booking forever.
    if (depositStatus !== 'pending' || !expiresAt) return;

    // The deadline is re-read inside the tick rather than being a dependency. Depending on
    // the countdown would rebuild this interval every second, and a 3-second timer that is
    // thrown away after 1 second never fires at all.
    const poll = setInterval(() => {
      void refreshDeposit();
      // One last check as the clock runs out, so a payment that landed in the final seconds
      // is not reported as a miss — then stop.
      if (secondsLeft(expiresAt) === 0) clearInterval(poll);
    }, POLL_MS);

    return () => clearInterval(poll);
  }, [depositStatus, expiresAt, refreshDeposit]);

  const amount = result?.deposit?.amountCents ?? 0;
  const lapsed = depositStatus === 'expired' || depositStatus === 'failed' || remaining === 0;

  if (lapsed && depositStatus !== 'paid') {
    return (
      <div className="flex flex-col gap-4">
        <Card className="px-4 py-3">
          <p className="font-medium text-brand-900">The slot was not held</p>
          <p className="mt-1 text-sm text-ink-muted">
            The deposit was not approved in time, so the time has gone back on offer.{' '}
            <strong className="font-medium text-brand-900">Nothing was charged.</strong>
          </p>
        </Card>
        <Button fullWidth onClick={onStartOver}>
          Pick another time
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-4 py-4">
        <p className="text-sm text-ink-muted">Deposit to hold your slot</p>
        <p className="text-2xl font-semibold tabular-nums text-brand-900">
          {formatMoney(amount, 'EUR')}
        </p>
        <p className="mt-2 text-sm text-brand-900">
          Open <strong className="font-medium">MB WAY</strong> on {phone} and approve the request.
        </p>
      </Card>

      <p className="flex items-center justify-center gap-2 text-sm text-ink-muted">
        <Spinner className="size-4 text-brand-ink" />
        Waiting for your approval —{' '}
        <span className="tabular-nums">{formatCountdown(remaining)}</span> left
      </p>

      <p className="text-center text-xs text-ink-muted">
        Keep this page open. The rest is due at your appointment.
      </p>
    </div>
  );
}
