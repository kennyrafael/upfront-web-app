import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Icon, Label, Switch } from '@/components/atoms';
import { Combobox, FormField, SelectField, TextareaField } from '@/components/molecules';
import { formatDate, useCopy } from '@/lib';
import {
  type Booking,
  clientsApi,
  RECURRENCE_FREQUENCIES,
  type RecurrenceFrequency,
  SETTABLE_BOOKING_STATUSES,
} from '@/lib/api';
import {
  formatDuration,
  formatMoney,
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/utils';
import { useBookingStore, useEmployeeStore, useServiceStore } from '@/stores';

export interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent when creating. */
  booking?: Booking;
  /** Pre-selected slot when the provider clicked an empty gap in the calendar. */
  initialStart?: Date;
  /** Preselects who, when the click came from a person's column in the day view. */
  initialEmployeeId?: string;
  /** Called when this save is what marked the booking completed. Carries the booking as it was. */
  onCompleted?: (booking: Booking) => void;
}

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
  employeeId: string;
}

function toFields(
  booking: Booking | undefined,
  initialStart: Date | undefined,
  initialEmployeeId: string | undefined,
): Fields {
  const start = booking ? new Date(booking.startsAt) : (initialStart ?? new Date());
  return {
    clientId: booking?.client.id ?? '',
    services: booking?.items.map((item) => chosenService(item.serviceId)) ?? [],
    date: toDateInputValue(start),
    time: toTimeInputValue(start),
    status: booking?.status ?? 'pending',
    notes: booking?.notes ?? '',
    // Every item carries the same person today, so the first one answers for the booking.
    employeeId: booking?.items[0]?.employeeId ?? initialEmployeeId ?? '',
  };
}

export function BookingFormDialog({
  open,
  onOpenChange,
  booking,
  initialStart,
  initialEmployeeId,
  onCompleted,
}: BookingFormDialogProps) {
  /**
   * The chosen client's name, kept here because the picker only knows the rows it last
   * searched for. Editing a booking starts with its client, who was never fetched.
   */
  const [clientLabel, setClientLabel] = useState('');
  /** `null` until asked. Only a definite "none" shows the warning, never a slow answer. */
  const [hasClients, setHasClients] = useState<boolean | null>(null);
  const services = useServiceStore((state) => state.items);
  const employees = useEmployeeStore((state) => state.items);
  const loadEmployees = useEmployeeStore((state) => state.load);
  const copy = useCopy();
  const loadServices = useServiceStore((state) => state.load);

  const create = useBookingStore((state) => state.create);
  const createRecurring = useBookingStore((state) => state.createRecurring);
  const update = useBookingStore((state) => state.update);
  const remove = useBookingStore((state) => state.remove);
  const removeFollowing = useBookingStore((state) => state.removeFollowing);
  const status = useBookingStore((state) => state.status);
  const error = useBookingStore((state) => state.error);
  const clearError = useBookingStore((state) => state.clearError);

  const [fields, setFields] = useState<Fields>(() =>
    toFields(booking, initialStart, initialEmployeeId),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});

  /**
   * The repeat, kept outside `Fields` because it is not part of the booking.
   *
   * It describes how many bookings to make, not what any one of them is — and it applies
   * only when creating. Editing one occurrence of a regular edits that occurrence; the rule
   * is not something an edit can reach.
   */
  const [repeats, setRepeats] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [until, setUntil] = useState('');
  const [skipped, setSkipped] = useState<{ startsAt: string; reason: string }[]>();
  const [allowOutsideHours, setAllowOutsideHours] = useState(false);

  useEffect(() => {
    if (open) {
      setFields(toFields(booking, initialStart, initialEmployeeId));
      setErrors({});
      setAllowOutsideHours(false);
      clearError();
      setClientLabel(booking?.client.name ?? '');
      void clientsApi
        .any()
        .then(setHasClients)
        // A failed check is not evidence of an empty client list; say nothing.
        .catch(() => setHasClients(true));
      void loadServices();
      void loadEmployees();
    }
  }, [open, booking, initialStart, initialEmployeeId, clearError, loadServices, loadEmployees]);

  /**
   * Only worth asking when there is somebody to choose between. A one-person business —
   * which is most of them — should never see this field, and the server defaults it to the
   * person booking anyway.
   */
  const employeeOptions = useMemo(
    () => employees.map((employee) => ({ value: employee.id, label: employee.name })),
    [employees],
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
    if (!fields.clientId) nextErrors.clientId = copy.bookings.errorClient;
    if (fields.services.length === 0) nextErrors.services = copy.bookings.errorService;

    const start = fromDateTimeInputs(fields.date, fields.time);
    if (!start) nextErrors.date = copy.bookings.errorWhen;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !start) return;

    const payload = {
      clientId: fields.clientId,
      serviceIds: fields.services.map((row) => row.serviceId),
      startsAt: start.toISOString(),
      notes: fields.notes.trim() || undefined,
      employeeId: fields.employeeId || undefined,
      allowOutsideHours: allowOutsideHours || undefined,
    };

    // A repeat only exists when creating. Editing one occurrence edits that occurrence.
    if (!booking && repeats) {
      if (!until) {
        setErrors({ date: copy.bookings.errorUntil });
        return;
      }

      const result = await createRecurring({ ...payload, frequency, until });
      if (!result) return;

      // Weeks that clashed are shown rather than swallowed: the provider's calendar will
      // disagree with what they asked for, and they need to know which ones before they
      // close this.
      if (result.skipped.length > 0) {
        setSkipped(result.skipped);
        return;
      }

      onOpenChange(false);
      return;
    }

    const ok = booking
      ? await update(booking.id, { ...payload, status: fields.status as Booking['status'] })
      : await create(payload);

    if (!ok) return;

    /**
     * Marking it completed is the moment to ask for the money, so the prompt opens from
     * here rather than waiting behind a menu somewhere.
     *
     * Only on the transition, not on every save of an already-completed booking: reopening
     * a finished appointment to fix a note should not put a payment dialog in the way.
     */
    const justCompleted =
      Boolean(booking) && booking?.status !== 'completed' && fields.status === 'completed';

    onOpenChange(false);
    if (justCompleted && booking) onCompleted?.(booking);
  }

  const busy = status === 'saving';
  const noClients = hasClients === false;
  const noServices = serviceOptions.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={booking ? copy.bookings.editTitle : copy.bookings.newTitle}
      description={copy.bookings.formLede}
      footer={
        <>
          {booking ? (
            <div className="mr-auto flex items-center gap-1">
              <Button
                variant="ghost"
                className="text-danger-ink hover:bg-danger/8 hover:text-danger-ink"
                disabled={busy}
                onClick={async () => {
                  if (await remove(booking.id)) onOpenChange(false);
                }}
              >
                {booking.seriesId ? copy.bookings.deleteThisOne : copy.common.delete}
              </Button>

              {/*
                Only for a repeat, and only ever forwards. Earlier occurrences may be
                completed, invoiced or paid for — deleting those is a decision taken one at
                a time, not a side effect of tidying up the future.
              */}
              {booking.seriesId ? (
                <Button
                  variant="ghost"
                  className="text-danger-ink hover:bg-danger/8 hover:text-danger-ink"
                  disabled={busy}
                  onClick={async () => {
                    if (await removeFollowing(booking.id)) onOpenChange(false);
                  }}
                >
                  {copy.bookings.deleteFollowing}
                </Button>
              ) : null}
            </div>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            {copy.common.cancel}
          </Button>
          <Button
            type="submit"
            form="booking-form"
            loading={busy}
            disabled={noClients || noServices}
          >
            {booking ? copy.bookings.saveButton : copy.bookings.addButton}
          </Button>
        </>
      }
    >
      <form id="booking-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {noClients || noServices ? (
          <p className="rounded-lg bg-warn/12 px-3 py-2 text-sm text-warn-ink">
            {copy.bookings.needFirst(noClients ? 'client' : 'service')}
          </p>
        ) : null}

        <Combobox
          label={copy.bookings.client}
          required
          placeholder={copy.bookings.searchClient}
          value={fields.clientId || undefined}
          selectedLabel={clientLabel}
          error={errors.clientId}
          loadingMessage={copy.common.searching}
          emptyMessage={copy.bookings.noClientMatch}
          loadOptions={async (term) =>
            (await clientsApi.search(term)).map((client) => ({
              value: client.id,
              label: client.name,
              // Two Anas are told apart by their numbers.
              detail: client.phone,
            }))
          }
          onChange={(option) => {
            setClientLabel(option.label);
            setField('clientId', option.value);
          }}
        />

        {employeeOptions.length > 1 ? (
          <SelectField
            label={copy.bookings.with}
            placeholder={copy.bookings.whoeverIsFree}
            options={employeeOptions}
            value={fields.employeeId || undefined}
            onValueChange={(value) => setField('employeeId', value)}
          />
        ) : null}

        <div>
          <Label>
            {copy.bookings.servicesLabel}
            <span aria-hidden="true" className="ml-0.5 text-danger-ink">
              *
            </span>
          </Label>

          {chosen.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {chosen.map((service) => (
                <li
                  key={service.key}
                  className="flex items-center gap-3 rounded-lg bg-sheet/60 px-3 py-2 text-sm ring-1 ring-hairline"
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
                    className="shrink-0 rounded-md p-1 text-ink-muted transition-colors hover:bg-danger/8 hover:text-danger-ink"
                  >
                    <Icon name="close" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-2">
            <SelectField
              label={copy.bookings.addService}
              srOnlyLabel
              placeholder={
                chosen.length > 0 ? copy.bookings.addAnotherService : copy.bookings.chooseService
              }
              options={serviceOptions}
              // Never holds a value: choosing one appends it and the control resets, so the
              // same service can be added twice in a row.
              value={undefined}
              error={errors.services}
              hint={copy.bookings.servicesHint}
              onValueChange={(value) =>
                setField('services', [...fields.services, chosenService(value)])
              }
            />
          </div>

          {chosen.length > 1 ? (
            <p className="mt-2 text-sm text-ink-muted">
              {copy.bookings.total}{' '}
              <span className="text-brand-900">{formatDuration(totalMinutes)}</span> ·{' '}
              <span className="tabular-nums text-brand-900">{formatMoney(totalCents)}</span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={copy.bookings.date}
            type="date"
            required
            error={errors.date}
            value={fields.date}
            onChange={(event) => setField('date', event.target.value)}
          />
          <FormField
            label={copy.bookings.startTime}
            type="time"
            required
            value={fields.time}
            onChange={(event) => setField('time', event.target.value)}
          />
        </div>

        {booking ? (
          <SelectField
            label={copy.common.status}
            options={SETTABLE_BOOKING_STATUSES.map((value) => ({
              value,
              label: copy.bookings.statuses[value] ?? value,
            }))}
            value={fields.status}
            onValueChange={(value) => setField('status', value)}
          />
        ) : null}

        {/*
          Only when creating. A regular is a decision about how many appointments to make,
          and there is nothing to decide once they exist — editing one of them edits that
          one, which is the whole of the edit model.
        */}
        {booking ? null : (
          <div className="rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
            {/* Tied by id rather than by nesting: Radix renders the switch as a button, and
                a button inside a bare label is associated with nothing. */}
            <label className="flex items-center gap-3 text-ink text-sm" htmlFor="booking-repeats">
              <Switch
                id="booking-repeats"
                checked={repeats}
                onCheckedChange={(next) => {
                  setRepeats(next);
                  setSkipped(undefined);
                }}
              />
              {copy.bookings.repeats}
            </label>

            {repeats ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SelectField
                  label={copy.bookings.frequency}
                  options={RECURRENCE_FREQUENCIES.map((value) => ({
                    value,
                    label: copy.bookings.frequencies[value],
                  }))}
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as RecurrenceFrequency)}
                />
                <FormField
                  label={copy.bookings.until}
                  type="date"
                  hint={copy.bookings.untilHint}
                  value={until}
                  onChange={(event) => setUntil(event.target.value)}
                />
              </div>
            ) : null}

            {/*
              Shown instead of closing the dialog. The provider asked for every Tuesday and
              did not get every Tuesday, and a toast they might miss is not good enough for
              a calendar that now disagrees with what they intended.
            */}
            {skipped && skipped.length > 0 ? (
              <div className="mt-3 rounded-lg bg-warning/8 px-3 py-2 text-sm">
                <p className="text-ink">{copy.bookings.skippedTitle(skipped.length)}</p>
                <ul className="mt-1 list-disc pl-5 text-ink-muted">
                  {skipped.map((miss) => (
                    <li key={miss.startsAt}>{formatDate(miss.startsAt)}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-brand-ink underline"
                  onClick={() => onOpenChange(false)}
                >
                  {copy.common.done}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <TextareaField
          label={copy.common.notes}
          hint={copy.common.optional}
          value={fields.notes}
          onChange={(event) => setField('notes', event.target.value)}
        />

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}

        {outsideHoursRejected ? (
          <div className="flex items-center justify-between rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
            <div>
              <Label htmlFor="allow-outside-hours">{copy.bookings.outsideHours}</Label>
              <p className="text-xs text-ink-muted">{copy.bookings.outsideHoursHint}</p>
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
