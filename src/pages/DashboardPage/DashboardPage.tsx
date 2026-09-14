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
import { formatMoney, weekdayLabel } from '@/lib/utils';
import { useProviderStore, useServiceStore } from '@/stores';

const UPCOMING = [
  { label: 'Clients & bookings', detail: 'Sprint 3' },
  { label: 'Recibos verdes', detail: 'Sprint 4' },
  { label: 'Payments', detail: 'Sprint 5' },
];

export function DashboardPage() {
  const profile = useProviderStore((state) => state.profile);
  const services = useServiceStore((state) => state.items);
  const loadServices = useServiceStore((state) => state.load);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const workingDays = new Set(profile?.workingHours.map((slot) => slot.weekday) ?? []);
  const cheapest = services.reduce<number | null>(
    (min, service) => (min === null ? service.priceCents : Math.min(min, service.priceCents)),
    null,
  );

  return (
    <DashboardLayout
      title={`Welcome, ${profile?.name ?? ''}`}
      description={[profile?.businessName, profile?.email].filter(Boolean).join(' · ')}
      actions={
        <Button variant="secondary" asChild>
          <Link to="/settings">Edit profile</Link>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>Service catalog</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/services">Manage</Link>
            </Button>
          </CardHeader>
          <CardBody>
            {services.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Nothing in the catalog yet.{' '}
                <Link to="/services" className="font-medium text-brand-700 hover:underline">
                  Add your first service
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
                    bookable {services.length === 1 ? 'service' : 'services'}
                    {cheapest !== null ? `, from ${formatMoney(cheapest)}` : ''}
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
            <CardTitle>Working week</CardTitle>
          </CardHeader>
          <CardBody>
            {workingDays.size === 0 ? (
              <p className="text-sm text-ink-muted">
                No hours set.{' '}
                <Link to="/settings" className="font-medium text-brand-700 hover:underline">
                  Set your hours
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
                        {profile?.workingHours
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

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        {UPCOMING.map((item) => (
          <Card key={item.label} className="px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-medium text-brand-900">{item.label}</h2>
              <Badge>{item.detail}</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-muted">Not built yet.</p>
          </Card>
        ))}
      </section>
    </DashboardLayout>
  );
}
