import { useEffect, useRef, useState } from 'react';
import { Button, Card, Spinner } from '@/components/atoms';
import { confirmMbWay, useCopy } from '@/lib';
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
 * **It also starts the payment.** Stripe has no documented way to confirm MB WAY from a
 * server, so the notification on the client's phone is sent from here — which makes this
 * screen part of the payment rather than a view of it. Mounting it is the ask.
 *
 * It still cannot know the payment succeeded: Stripe's own answer is a hint, and the record
 * is the webhook the server receives. So this polls, and it counts down out loud, because the
 * slot really is released when the timer runs out and finding that out silently would be
 * worse.
 */
export function DepositWaiting({ phone, onStartOver }: DepositWaitingProps) {
  const copy = useCopy();
  const result = usePublicBookingStore((state) => state.result);
  const depositStatus = usePublicBookingStore((state) => state.depositStatus);
  const refreshDeposit = usePublicBookingStore((state) => state.refreshDeposit);

  const expiresAt = result?.deposit?.expiresAt;
  const clientSecret = result?.deposit?.clientSecret;
  const [remaining, setRemaining] = useState(() => (expiresAt ? secondsLeft(expiresAt) : 0));
  /** Set when Stripe refused outright, or when there is no Stripe to ask. */
  const [problem, setProblem] = useState<{ unavailable: boolean; message?: string }>();
  /**
   * Whether the request has already gone out.
   *
   * A ref, not state: React re-runs effects on mount in development, and asking twice would
   * put two payment requests on somebody's phone for one booking.
   */
  const asked = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = setInterval(() => setRemaining(secondsLeft(expiresAt)), 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  useEffect(() => {
    if (!clientSecret || asked.current) return;
    asked.current = true;

    void (async () => {
      const outcome = await confirmMbWay(clientSecret, phone);
      if (outcome.ok) {
        // Their app says yes. The money is not ours to declare received — the webhook does
        // that — so this only stops us waiting three seconds for the next poll.
        await refreshDeposit();
        return;
      }
      // Both "no Stripe key" and "Stripe.js has no MB WAY" are ours to fix, not the client's:
      // nothing they do will make the payment work, so they are told the slot is not held.
      setProblem({
        unavailable: outcome.reason !== 'declined',
        message: outcome.message,
      });
    })();
  }, [clientSecret, phone, refreshDeposit]);

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

  // Said plainly rather than left as a spinner that will never stop. A refusal from the app
  // is the client's own decision and they can try again; no Stripe account at all is the
  // business's problem, and the client needs to hear that the slot is not theirs.
  if (problem && depositStatus !== 'paid') {
    return (
      <div className="flex flex-col gap-4">
        <Card className="px-4 py-3">
          <p className="font-medium text-brand-900">
            {problem.unavailable ? copy.deposit.notHeld : copy.deposit.couldNotStart}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {problem.unavailable ? copy.deposit.unavailable : problem.message}{' '}
            <strong className="font-medium text-brand-900">{copy.deposit.nothingCharged}</strong>
          </p>
        </Card>
        <Button fullWidth onClick={onStartOver}>
          {problem.unavailable ? copy.deposit.pickAnother : copy.deposit.tryAgain}
        </Button>
      </div>
    );
  }

  if (lapsed && depositStatus !== 'paid') {
    return (
      <div className="flex flex-col gap-4">
        <Card className="px-4 py-3">
          <p className="font-medium text-brand-900">{copy.deposit.notHeld}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {copy.deposit.expiredBody}{' '}
            <strong className="font-medium text-brand-900">{copy.deposit.nothingCharged}</strong>
          </p>
        </Card>
        <Button fullWidth onClick={onStartOver}>
          {copy.deposit.pickAnother}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-4 py-4">
        <p className="text-sm text-ink-muted">{copy.deposit.title}</p>
        <p className="text-2xl font-semibold tabular-nums text-brand-900">
          {formatMoney(amount, 'EUR')}
        </p>
        <p className="mt-2 text-sm text-brand-900">
          {copy.deposit.openApp} <strong className="font-medium">MB WAY</strong>
          {copy.deposit.approveOn(phone)}
        </p>
      </Card>

      <p className="flex items-center justify-center gap-2 text-sm text-ink-muted">
        <Spinner className="size-4 text-brand-ink" />
        {copy.deposit.waitingApproval}{' '}
        <span className="tabular-nums">{formatCountdown(remaining)}</span> {copy.deposit.timeLeft}
      </p>

      <p className="text-center text-xs text-ink-muted">{copy.deposit.keepOpen}</p>
    </div>
  );
}
