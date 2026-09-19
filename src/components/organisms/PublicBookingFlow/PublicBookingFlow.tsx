import { type FormEvent, useMemo, useState } from 'react';
import { Badge, Button, Spinner } from '@/components/atoms';
import { FormField, TextareaField } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { PublicProvider } from '@/lib/api';
import {
  cn,
  formatDuration,
  formatMoney,
  isDifferentZone,
  zonedDate,
  zonedDateTime,
  zonedTime,
} from '@/lib/utils';
import { usePublicBookingStore } from '@/stores';

export interface PublicBookingFlowProps {
  provider: PublicProvider;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function PublicBookingFlow({ provider }: PublicBookingFlowProps) {
  const t = useCopy();
  const copy = t.publicBooking;
  const step = usePublicBookingStore((state) => state.step);
  const serviceId = usePublicBookingStore((state) => state.serviceId);
  const day = usePublicBookingStore((state) => state.day);
  const slots = usePublicBookingStore((state) => state.slots);
  const selectedSlot = usePublicBookingStore((state) => state.selectedSlot);
  const status = usePublicBookingStore((state) => state.status);
  const error = usePublicBookingStore((state) => state.error);
  const chooseService = usePublicBookingStore((state) => state.chooseService);
  const choosePerson = usePublicBookingStore((state) => state.choosePerson);
  const setDay = usePublicBookingStore((state) => state.setDay);
  const selectSlot = usePublicBookingStore((state) => state.selectSlot);
  const back = usePublicBookingStore((state) => state.back);
  const book = usePublicBookingStore((state) => state.book);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});

  const service = useMemo(
    () => provider.services.find((item) => item.id === serviceId),
    [provider.services, serviceId],
  );

  const zoneDiffers = useMemo(() => isDifferentZone(provider.timezone), [provider.timezone]);

  /**
   * An estimate, shown so nobody is surprised. The server decides the real figure — it also
   * applies a minimum — and it is the server's number that gets charged.
   */
  const deposit = useMemo(() => {
    if (!service || !provider.depositPercent) return 0;
    return Math.round((service.priceCents * provider.depositPercent) / 100);
  }, [service, provider.depositPercent]);

  // The horizon is the provider's; offering days past it would only produce empty grids.
  const lastBookableDay = useMemo(
    () => new Date(Date.now() + provider.horizonDays * DAY_MS),
    [provider.horizonDays],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors: { name?: string; phone?: string } = {};
    if (name.trim().length < 2) errors.name = copy.nameError;
    if (phone.replace(/\D/g, '').length < 6) errors.phone = copy.phoneError;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await book({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      company: company.trim() || undefined,
    });
  }

  if (step === 'service') {
    if (provider.services.length === 0) {
      return (
        <p className="rounded-lg bg-brand-900/4 px-3 py-4 text-sm text-ink-muted">
          {copy.nothingBookable}
        </p>
      );
    }

    return (
      <ul className="flex flex-col gap-2">
        {provider.services.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => void chooseService(item.id)}
              className={cn(
                'w-full rounded-xl bg-sheet/60 px-4 py-3 text-left ring-1 ring-hairline transition-colors',
                'hover:bg-brand-700/8 focus-visible:outline focus-visible:outline-2',
                'focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-brand-900">{item.name}</span>
                <span className="shrink-0 tabular-nums text-brand-900">
                  {formatMoney(item.priceCents, item.currency)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">
                {formatDuration(item.durationMinutes)}
                {item.description ? ` · ${item.description}` : ''}
              </p>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  if (step === 'person') {
    /**
     * "Anyone" first, and deliberately as the prominent option.
     *
     * It is the honest default for most clients, it gives the shop the most room to fill the
     * day, and it is the only answer that lets them move the appointment later without a
     * phone call. Somebody who cares about who cuts their hair will scan past it anyway.
     */
    return (
      <ul className="flex flex-col gap-2">
        <li>
          <button
            type="button"
            onClick={() => void choosePerson(null)}
            className={cn(
              'w-full rounded-xl bg-sheet/60 px-4 py-3 text-left ring-1 ring-hairline transition-colors',
              'hover:bg-brand-700/8 focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            )}
          >
            <span className="font-medium text-brand-900">{copy.anyone}</span>
            <p className="mt-0.5 text-ink-muted text-sm">{copy.anyoneHint}</p>
          </button>
        </li>

        {provider.people
          .filter((person) =>
            (provider.services.find((s) => s.id === serviceId)?.employeeIds ?? []).includes(
              person.id,
            ),
          )
          .map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => void choosePerson(person.id)}
                className={cn(
                  'w-full rounded-xl bg-sheet/60 px-4 py-3 text-left ring-1 ring-hairline transition-colors',
                  'hover:bg-brand-700/8 focus-visible:outline focus-visible:outline-2',
                  'focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                )}
              >
                <span className="font-medium text-brand-900">{person.name}</span>
              </button>
            </li>
          ))}
      </ul>
    );
  }
  if (step === 'slot') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={back}>
            {copy.backToServices}
          </Button>
          <Badge variant="brand">{service?.name}</Badge>
        </div>

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
            {zonedDate(day, provider.timezone)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={day >= lastBookableDay}
            onClick={() => void setDay(new Date(day.getTime() + DAY_MS))}
          >
            →
          </Button>
        </div>

        {status === 'loadingSlots' ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
            <Spinner className="size-4 text-brand-ink" /> {copy.findingTimes}
          </p>
        ) : slots.length === 0 ? (
          <p className="rounded-lg bg-brand-900/4 px-3 py-6 text-center text-sm text-ink-muted">
            {copy.nothingFree}
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <li key={slot.startsAt}>
                <button
                  type="button"
                  onClick={() => selectSlot(slot.startsAt)}
                  className={cn(
                    'w-full rounded-lg bg-sheet/60 px-2 py-2 text-sm tabular-nums text-brand-900',
                    'ring-1 ring-hairline transition-colors hover:bg-brand-700/10',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                    'focus-visible:outline-brand-600',
                  )}
                >
                  {zonedTime(slot.startsAt, provider.timezone)}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Only shown when it could actually mislead: the visitor's clock disagrees. */}
        {zoneDiffers ? (
          <p className="rounded-lg bg-warn/12 px-3 py-2 text-xs text-warn-ink">
            {copy.zoneWarning(provider.timezone)}
          </p>
        ) : (
          <p className="text-center text-xs text-ink-muted">{copy.zoneNote(provider.timezone)}</p>
        )}

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" type="button" onClick={back}>
          {copy.backToTimes}
        </Button>
        <Badge variant="brand">
          {selectedSlot ? zonedTime(selectedSlot, provider.timezone) : ''}
        </Badge>
      </div>

      <div className="rounded-xl bg-sheet/50 px-4 py-3 ring-1 ring-hairline">
        <p className="font-medium text-brand-900">{service?.name}</p>
        <p className="text-sm text-ink-muted">
          {selectedSlot ? zonedDateTime(selectedSlot, provider.timezone) : ''} ({provider.timezone})
        </p>
      </div>

      <FormField
        label={t.common.yourName}
        required
        autoFocus
        autoComplete="name"
        error={fieldErrors.name}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        label={t.common.phone}
        type="tel"
        required
        autoComplete="tel"
        hint={copy.phoneHint}
        error={fieldErrors.phone}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <FormField
        label={t.common.email}
        type="email"
        autoComplete="email"
        hint={copy.emailHint}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextareaField
        label={copy.notesLabel}
        rows={2}
        hint={t.common.optional}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      {/* Honeypot: hidden from people, irresistible to naive bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      {/* Said before the button, not after it. A deposit a client only discovers once their
          phone buzzes is the kind of surprise that ends in a chargeback. */}
      {deposit > 0 ? (
        <p className="rounded-lg bg-brand-700/8 px-3 py-2 text-sm text-brand-900">
          {copy.depositLead(formatMoney(deposit, service?.currency))} {copy.depositHow}
          {/* The condition, stated before they commit rather than discovered afterwards. */}
          <span className="mt-1 block">{copy.depositNotRefundable}</span>
        </p>
      ) : null}

      <Button type="submit" fullWidth loading={status === 'saving'}>
        {deposit > 0 ? copy.continueToDeposit : copy.requestThisTime}
      </Button>
    </form>
  );
}
