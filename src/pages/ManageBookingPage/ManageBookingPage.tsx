import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Card, PublicLayout, Spinner } from '@/components';
import { ConfirmDialog } from '@/components/molecules';
import { zonedDateTime } from '@/lib/utils';
import { useManageBookingStore } from '@/stores';

const STATUS_LABELS: Record<string, { label: string; variant: 'brand' | 'warning' | 'neutral' }> = {
  pending: { label: 'Awaiting confirmation', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'brand' },
  completed: { label: 'Completed', variant: 'neutral' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
  no_show: { label: 'Missed', variant: 'neutral' },
};

export function ManageBookingPage() {
  const { token = '' } = useParams();

  const booking = useManageBookingStore((state) => state.booking);
  const status = useManageBookingStore((state) => state.status);
  const error = useManageBookingStore((state) => state.error);
  const load = useManageBookingStore((state) => state.load);
  const cancel = useManageBookingStore((state) => state.cancel);
  const reset = useManageBookingStore((state) => state.reset);

  const [confirming, setConfirming] = useState(false);

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
    <PublicLayout businessName={booking.businessName} title="Your booking">
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
          <p role="alert" className="rounded-lg bg-red-600/8 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {booking.cancellable ? (
          <Button variant="secondary" fullWidth onClick={() => setConfirming(true)}>
            Cancel this booking
          </Button>
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
        description={`Your ${booking.serviceName} on ${zonedDateTime(booking.startsAt, booking.timezone)} will be released. This cannot be undone.`}
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
