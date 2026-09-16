import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Card, PublicLayout, Spinner } from '@/components';
import { ConfirmDialog } from '@/components/molecules';
import { formatMoney, zonedDate, zonedDateTime, zonedTime } from '@/lib/utils';
import { useManageBookingStore } from '@/stores';

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_LABELS: Record<string, { label: string; variant: 'brand' | 'warning' | 'neutral' }> = {
  pending: { label: 'Awaiting confirmation', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'brand' },
  completed: { label: 'Completed', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  expired: { label: 'Not held — deposit unpaid', variant: 'neutral' },
  no_show: { label: 'Missed', variant: 'neutral' },
};

export function ManageBookingPage() {
  const { token = '' } = useParams();

  const booking = useManageBookingStore((state) => state.booking);
  const status = useManageBookingStore((state) => state.status);
  const error = useManageBookingStore((state) => state.error);
  const load = useManageBookingStore((state) => state.load);
  const cancel = useManageBookingStore((state) => state.cancel);
  const slots = useManageBookingStore((state) => state.slots);
  const day = useManageBookingStore((state) => state.day);
  const setDay = useManageBookingStore((state) => state.setDay);
  const loadSlots = useManageBookingStore((state) => state.loadSlots);
  const reschedule = useManageBookingStore((state) => state.reschedule);
  const reset = useManageBookingStore((state) => state.reset);

  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    void load(token);
    return reset;
  }, [token, load, reset]);

  if (status === 'loading' && !booking) {
    return (
      <PublicLayout>
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
          <Spinner className="size-4 text-brand-700" /> Loading…
        </p>
      </PublicLayout>
    );
  }

  if (!booking) {
    return (
      <PublicLayout title="Booking not found">
        <p className="text-sm text-ink-muted">
          {error ?? 'This link is no longer valid. Check the address, or contact the business.'}
        </p>
      </PublicLayout>
    );
  }

  const badge = STATUS_LABELS[booking.status] ?? { label: booking.status, variant: 'neutral' };

  return (
    <PublicLayout
      businessName={booking.businessName}
      brandColor={booking.brandColor}
      logoUrl={booking.logoUrl}
      title="Your booking"
    >
      <div className="flex flex-col gap-4">
        <Card className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-brand-900">{booking.serviceName}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {zonedDateTime(booking.startsAt, booking.timezone)}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">Times shown in {booking.timezone}.</p>
            </div>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>

          <dl className="mt-4 flex flex-col gap-1 border-t border-hairline pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Reference</dt>
              <dd className="tabular-nums text-brand-900">{booking.reference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Name</dt>
              <dd className="text-brand-900">{booking.clientName}</dd>
            </div>
          </dl>
        </Card>

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}

        {/* The deposit rule, said once, in the place where it decides what someone does
            next. A client who only learns it after cancelling has a grievance. */}
        {/* Not on an expired booking: nothing was ever charged, so telling someone their
            deposit is non-refundable would be alarming and untrue. */}
        {booking.deposit && booking.status !== 'cancelled' && booking.status !== 'expired' ? (
          <p className="rounded-lg bg-brand-700/8 px-3 py-2 text-sm text-brand-900">
            Your {formatMoney(booking.deposit.amountCents, 'EUR')} deposit is not refundable.
            {booking.reschedulable
              ? ' You can move this appointment instead, and the deposit moves with it.'
              : ` Appointments can only be moved with ${booking.noticeHours} hours' notice, which has now passed.`}
          </p>
        ) : null}

        {booking.reschedulable ? (
          <Button
            fullWidth
            onClick={() => {
              setPicking(true);
              void loadSlots();
            }}
          >
            Move to another time
          </Button>
        ) : null}

        {picking ? (
          <Card className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={day.getTime() <= new Date().setHours(0, 0, 0, 0)}
                onClick={() => void setDay(new Date(day.getTime() - DAY_MS))}
              >
                ←
              </Button>
              <span className="text-sm font-medium text-brand-900">
                {zonedDate(day, booking.timezone)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void setDay(new Date(day.getTime() + DAY_MS))}
              >
                →
              </Button>
            </div>

            {status === 'loadingSlots' ? (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
                <Spinner className="size-4 text-brand-700" /> Finding free times…
              </p>
            ) : slots.length === 0 ? (
              <p className="rounded-lg bg-brand-900/4 px-3 py-6 text-center text-sm text-ink-muted">
                Nothing free on this day. Try another.
              </p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <li key={slot}>
                    <button
                      type="button"
                      disabled={status === 'saving'}
                      onClick={async () => {
                        if (await reschedule(token, slot)) setPicking(false);
                      }}
                      className="w-full rounded-lg bg-surface/60 px-2 py-2 text-sm tabular-nums text-brand-900 ring-1 ring-hairline transition-colors hover:bg-brand-700/10 disabled:opacity-50"
                    >
                      {zonedTime(slot, booking.timezone)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}

        {booking.cancellable ? (
          <Button variant="secondary" fullWidth onClick={() => setConfirming(true)}>
            Cancel this booking
          </Button>
        ) : booking.status === 'expired' ? (
          <p className="text-sm text-ink-muted">
            The deposit was not completed in time, so this slot went back on offer.{' '}
            <strong className="font-medium text-brand-900">Nothing was charged.</strong> You are
            welcome to book again.
          </p>
        ) : booking.status === 'cancelled' ? (
          <p className="text-sm text-ink-muted">
            This booking is cancelled. Contact {booking.businessName} if you would like another
            time.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            This appointment can no longer be cancelled online. Please contact{' '}
            {booking.businessName} directly.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Cancel this booking?"
        description={
          booking.deposit
            ? `Your ${booking.serviceName} on ${zonedDateTime(booking.startsAt, booking.timezone)} will be released, and your ${formatMoney(booking.deposit.amountCents, 'EUR')} deposit will not be returned.${booking.reschedulable ? ' Moving the appointment instead would keep it.' : ''} This cannot be undone.`
            : `Your ${booking.serviceName} on ${zonedDateTime(booking.startsAt, booking.timezone)} will be released. This cannot be undone.`
        }
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep it"
        destructive
        loading={status === 'saving'}
        onConfirm={async () => {
          if (await cancel(token)) setConfirming(false);
        }}
      />
    </PublicLayout>
  );
}
