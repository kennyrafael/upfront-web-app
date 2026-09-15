import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Label, Switch } from '@/components/atoms';
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

interface Fields {
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: string;
  notes: string;
}

function toFields(booking: Booking | undefined, initialStart: Date | undefined): Fields {
  const start = booking ? new Date(booking.startsAt) : (initialStart ?? new Date());
  return {
    clientId: booking?.client.id ?? '',
    serviceId: booking?.service.id ?? '',
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
    if (!fields.serviceId) nextErrors.serviceId = 'Pick a service';

    const start = fromDateTimeInputs(fields.date, fields.time);
    if (!start) nextErrors.date = 'Pick a valid date and time';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !start) return;

    const payload = {
      clientId: fields.clientId,
      serviceId: fields.serviceId,
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
      description="The end time comes from the service duration; overlaps are rejected."
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

        <SelectField
          label="Service"
          required
          placeholder="Choose a service"
          options={serviceOptions}
          value={fields.serviceId || undefined}
          error={errors.serviceId}
          hint="Sets the duration and the price recorded on the booking."
          onValueChange={(value) => setField('serviceId', value)}
        />

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
