import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Icon, Label, Switch } from '@/components/atoms';
import { FormField, SelectField, TextareaField } from '@/components/molecules';
import { type Booking, SETTABLE_BOOKING_STATUSES } from '@/lib/api';
import {
  formatDuration,
  formatMoney,
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/utils';
import { useBookingStore, useClientStore, useServiceStore } from '@/stores';

export interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent when creating. */
  booking?: Booking;
  /** Pre-selected slot when the provider clicked an empty gap in the calendar. */
  initialStart?: Date;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

/**
 * One chosen service, with an identity of its own.
 *
 * The id alone cannot be the identity: the same service may be on an appointment twice, and
 * two rows that claim to be the same thing make removing one of them ambiguous.
 */
interface ChosenService {
  key: string;
  serviceId: string;
}

let nextKey = 0;
const chosenService = (serviceId: string): ChosenService => ({
  key: `row-${nextKey++}`,
  serviceId,
});

interface Fields {
  clientId: string;
  /** In the order they happen, and a service may appear twice. */
  services: ChosenService[];
  date: string;
  time: string;
  status: string;
  notes: string;
}

function toFields(booking: Booking | undefined, initialStart: Date | undefined): Fields {
  const start = booking ? new Date(booking.startsAt) : (initialStart ?? new Date());
  return {
    clientId: booking?.client.id ?? '',
    services: booking?.items.map((item) => chosenService(item.serviceId)) ?? [],
    date: toDateInputValue(start),
    time: toTimeInputValue(start),
    status: booking?.status ?? 'pending',
    notes: booking?.notes ?? '',
  };
}

export function BookingFormDialog({
  open,
  onOpenChange,
  booking,
  initialStart,
}: BookingFormDialogProps) {
  const clients = useClientStore((state) => state.items);
  const loadClients = useClientStore((state) => state.load);
  const services = useServiceStore((state) => state.items);
  const loadServices = useServiceStore((state) => state.load);

  const create = useBookingStore((state) => state.create);
  const update = useBookingStore((state) => state.update);
  const remove = useBookingStore((state) => state.remove);
  const status = useBookingStore((state) => state.status);
  const error = useBookingStore((state) => state.error);
  const clearError = useBookingStore((state) => state.clearError);

  const [fields, setFields] = useState<Fields>(() => toFields(booking, initialStart));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [allowOutsideHours, setAllowOutsideHours] = useState(false);

  useEffect(() => {
    if (open) {
      setFields(toFields(booking, initialStart));
      setErrors({});
      setAllowOutsideHours(false);
      clearError();
      void loadClients();
      void loadServices();
    }
  }, [open, booking, initialStart, clearError, loadClients, loadServices]);

  const clientOptions = useMemo(
    () => clients.map((client) => ({ value: client.id, label: client.name })),
    [clients],
  );

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        value: service.id,
        label: `${service.name} · ${formatDuration(service.durationMinutes)} · ${formatMoney(service.priceCents, service.currency)}`,
      })),
    [services],
  );

  /**
   * What the provider has chosen, resolved against the catalog.
   *
   * By index rather than by id, because the same service can legitimately appear twice —
   * two of the same treatment in one visit is a real appointment.
   */
  const chosen = useMemo(
    () =>
      fields.services.flatMap((row) => {
        const service = services.find((candidate) => candidate.id === row.serviceId);
        return service ? [{ ...service, key: row.key }] : [];
      }),
    [fields.services, services],
  );

  const totalMinutes = chosen.reduce((sum, service) => sum + service.durationMinutes, 0);
  const totalCents = chosen.reduce((sum, service) => sum + service.priceCents, 0);

  // The API refuses out-of-hours slots unless told otherwise; surface that as an opt-in
  // rather than a dead end, since providers do take the occasional early appointment.
  const outsideHoursRejected = Boolean(error && /working hours/i.test(error));

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof Fields, string>> = {};
    if (!fields.clientId) nextErrors.clientId = 'Pick a client';
    if (fields.services.length === 0) nextErrors.services = 'Pick at least one service';

    const start = fromDateTimeInputs(fields.date, fields.time);
    if (!start) nextErrors.date = 'Pick a valid date and time';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !start) return;

    const payload = {
      clientId: fields.clientId,
      serviceIds: fields.services.map((row) => row.serviceId),
      startsAt: start.toISOString(),
      notes: fields.notes.trim() || undefined,
      allowOutsideHours: allowOutsideHours || undefined,
    };

    const ok = booking
      ? await update(booking.id, { ...payload, status: fields.status as Booking['status'] })
      : await create(payload);

    if (ok) onOpenChange(false);
  }

  const busy = status === 'saving';
  const noClients = clientOptions.length === 0;
  const noServices = serviceOptions.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={booking ? 'Edit booking' : 'New booking'}
      description="The end time comes from the services chosen; overlaps are rejected."
      footer={
        <>
          {booking ? (
            <Button
              variant="ghost"
              className="mr-auto text-red-700 hover:bg-red-600/8 hover:text-red-800"
              disabled={busy}
              onClick={async () => {
                if (await remove(booking.id)) onOpenChange(false);
              }}
            >
              Delete
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="booking-form"
            loading={busy}
            disabled={noClients || noServices}
          >
            {booking ? 'Save booking' : 'Add booking'}
          </Button>
        </>
      }
    >
      <form id="booking-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {noClients || noServices ? (
          <p className="rounded-lg bg-amber-500/12 px-3 py-2 text-sm text-amber-900">
            You need at least one {noClients ? 'client' : 'service'} before you can book.
          </p>
        ) : null}

        <SelectField
          label="Client"
          required
          placeholder="Choose a client"
          options={clientOptions}
          value={fields.clientId || undefined}
          error={errors.clientId}
          onValueChange={(value) => setField('clientId', value)}
        />

        <div>
          <Label>
            Services
            <span aria-hidden="true" className="ml-0.5 text-red-700">
              *
            </span>
          </Label>

          {chosen.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {chosen.map((service) => (
                <li
                  key={service.key}
                  className="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2 text-sm ring-1 ring-hairline"
                >
                  <span className="min-w-0 flex-1 truncate text-brand-900">{service.name}</span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {formatDuration(service.durationMinutes)}
                  </span>
                  <span className="shrink-0 tabular-nums text-brand-900">
                    {formatMoney(service.priceCents, service.currency)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${service.name}`}
                    onClick={() =>
                      setField(
                        'services',
                        fields.services.filter((row) => row.key !== service.key),
                      )
                    }
                    className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-red-600/8 hover:text-red-800"
                  >
                    <Icon name="close" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-2">
            <SelectField
              label="Add a service"
              srOnlyLabel
              placeholder={chosen.length > 0 ? 'Add another service' : 'Choose a service'}
              options={serviceOptions}
              // Never holds a value: choosing one appends it and the control resets, so the
              // same service can be added twice in a row.
              value={undefined}
              error={errors.services}
              hint="The appointment runs as long as everything on it, and is priced the same way."
              onValueChange={(value) =>
                setField('services', [...fields.services, chosenService(value)])
              }
            />
          </div>

          {chosen.length > 1 ? (
            <p className="mt-2 text-sm text-ink-muted">
              Total: <span className="text-brand-900">{formatDuration(totalMinutes)}</span> ·{' '}
              <span className="tabular-nums text-brand-900">{formatMoney(totalCents)}</span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Date"
            type="date"
            required
            error={errors.date}
            value={fields.date}
            onChange={(event) => setField('date', event.target.value)}
          />
          <FormField
            label="Start time"
            type="time"
            required
            value={fields.time}
            onChange={(event) => setField('time', event.target.value)}
          />
        </div>

        {booking ? (
          <SelectField
            label="Status"
            options={SETTABLE_BOOKING_STATUSES.map((value) => ({
              value,
              label: STATUS_LABELS[value] ?? value,
            }))}
            value={fields.status}
            onValueChange={(value) => setField('status', value)}
          />
        ) : null}

        <TextareaField
          label="Notes"
          hint="Optional."
          value={fields.notes}
          onChange={(event) => setField('notes', event.target.value)}
        />

        {error ? (
          <p role="alert" className="rounded-lg bg-red-600/8 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {outsideHoursRejected ? (
          <div className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-3 ring-1 ring-hairline">
            <div>
              <Label htmlFor="allow-outside-hours">Book outside working hours</Label>
              <p className="text-xs text-ink-muted">
                Only skips the hours check, never an overlap.
              </p>
            </div>
            <Switch
              id="allow-outside-hours"
              checked={allowOutsideHours}
              onCheckedChange={setAllowOutsideHours}
            />
          </div>
        ) : null}
      </form>
    </Dialog>
  );
}
