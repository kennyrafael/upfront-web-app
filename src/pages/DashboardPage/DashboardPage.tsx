import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DashboardLayout,
} from '@/components';
import { useCopy } from '@/lib';
import { describeBooking } from '@/lib/api';
import { formatMoney, formatTime, isSameDay, weekdayLabel } from '@/lib/utils';
import {
  useAuthStore,
  useBookingStore,
  useBusinessStore,
  useClientStore,
  usePaymentStore,
  useServiceStore,
} from '@/stores';

export function DashboardPage() {
  const copy = useCopy();
  const profile = useBusinessStore((state) => state.profile);
  const me = useAuthStore((state) => state.user);
  const services = useServiceStore((state) => state.items);
  const loadServices = useServiceStore((state) => state.load);
  const clients = useClientStore((state) => state.items);
  const loadClients = useClientStore((state) => state.load);
  const bookings = useBookingStore((state) => state.items);
  const loadBookings = useBookingStore((state) => state.load);
  const payments = usePaymentStore((state) => state.summary);
  const loadPayments = usePaymentStore((state) => state.load);

  useEffect(() => {
    void loadServices();
    void loadClients();
    void loadBookings();
    void loadPayments();
  }, [loadServices, loadClients, loadBookings, loadPayments]);

  const today = new Date();
  const todaysBookings = bookings
    .filter((booking) => isSameDay(new Date(booking.startsAt), today))
    .filter((booking) => booking.status !== 'cancelled');

  const workingDays = new Set(profile?.hours.map((slot) => slot.weekday) ?? []);
  const cheapest = services.reduce<number | null>(
    (min, service) => (min === null ? service.priceCents : Math.min(min, service.priceCents)),
    null,
  );

  return (
    <DashboardLayout
      title={copy.dashboard.welcome(me?.name ?? '')}
      description={[profile?.name, me?.email].filter(Boolean).join(' · ')}
      actions={
        <Button variant="secondary" asChild>
          <Link to="/settings">{copy.dashboard.editProfile}</Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>{copy.dashboard.serviceCatalog}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/services">{copy.dashboard.manage}</Link>
            </Button>
          </CardHeader>
          <CardBody>
            {services.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nothing in the catalog yet.{' '}
                <Link to="/services" className="font-medium text-brand-ink hover:underline">
                  {copy.dashboard.addFirstService}
                </Link>
                .
              </p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums text-brand-900">
                    {services.length}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {copy.dashboard.bookableFrom(
                      services.length,
                      cheapest === null ? null : formatMoney(cheapest),
                    )}
                  </span>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {services.slice(0, 6).map((service) => (
                    <li key={service.id}>
                      <Badge variant="brand">{service.name}</Badge>
                    </li>
                  ))}
                  {services.length > 6 ? (
                    <li>
                      <Badge>+{services.length - 6} more</Badge>
                    </li>
                  ) : null}
                </ul>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.dashboard.workingWeek}</CardTitle>
          </CardHeader>
          <CardBody>
            {workingDays.size === 0 ? (
              <p className="text-sm text-ink-muted">
                No hours set.{' '}
                <Link to="/settings" className="font-medium text-brand-ink hover:underline">
                  {copy.dashboard.setYourHours}
                </Link>
                .
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {[...workingDays]
                  .sort((a, b) => a - b)
                  .map((weekday) => (
                    <li key={weekday} className="flex justify-between gap-4">
                      <span className="text-brand-900">{weekdayLabel(weekday)}</span>
                      <span className="text-right tabular-nums text-ink-muted">
                        {profile?.hours
                          .filter((slot) => slot.weekday === weekday)
                          .map((slot) => `${slot.start}–${slot.end}`)
                          .join(', ')}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>{copy.dashboard.today}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bookings">{copy.dashboard.openCalendar}</Link>
            </Button>
          </CardHeader>
          <CardBody>
            {todaysBookings.length === 0 ? (
              <p className="text-sm text-ink-muted">
                {copy.dashboard.nothingToday}{' '}
                <Link to="/bookings" className="font-medium text-brand-ink hover:underline">
                  {copy.dashboard.addABooking}
                </Link>
                .
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-hairline/70">
                {todaysBookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="w-24 shrink-0 tabular-nums text-sm text-ink-muted">
                      {formatTime(booking.startsAt)}–{formatTime(booking.endsAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-brand-900">
                      {booking.client.name}
                    </span>
                    <span className="hidden truncate text-sm text-ink-muted sm:block">
                      {describeBooking(booking)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>{copy.dashboard.clients}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/clients">{copy.dashboard.manage}</Link>
            </Button>
          </CardHeader>
          <CardBody>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums text-brand-900">
                {clients.length}
              </span>
              <span className="text-sm text-ink-muted">{copy.dashboard.onTheBooks}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {payments ? (
        <Card className="mt-4">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>{copy.dashboard.money}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/payments">{copy.dashboard.openLedger}</Link>
            </Button>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                {copy.dashboard.collected}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-brand-900">
                {formatMoney(payments.collectedCents)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                {copy.dashboard.outstanding}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-brand-900">
                {formatMoney(payments.outstanding.totalCents)}
              </p>
              <p className="text-xs text-ink-muted">
                {copy.dashboard.bookingCount(payments.outstanding.count)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                {copy.dashboard.pending}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tabular-nums text-brand-900">
                {formatMoney(payments.pendingCents)}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </DashboardLayout>
  );
}
