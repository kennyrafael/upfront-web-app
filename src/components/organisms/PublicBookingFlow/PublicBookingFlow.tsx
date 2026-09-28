import { type FormEvent, useMemo, useState } from 'react';
import { Badge, Button, Checkbox, Spinner } from '@/components/atoms';
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
import { qualifiedFor, usePublicBookingStore } from '@/stores';

export interface PublicBookingFlowProps {
  provider: PublicProvider;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `YYYY-MM-DD` to a local Date on that calendar day.
 *
 * Two traps, and the construction dodges both. `new Date('2026-10-03')` is parsed as **UTC**
 * midnight, so for a visitor west of Greenwich the label and the day jumped to would both land
 * a day early — hence building it from the parts. And **noon rather than midnight**, because
 * the label renders this in the *provider's* timezone: a local midnight in Tokyo is still the
 * previous afternoon in Lisbon, so a midnight Date would print the day before for anyone far
 * enough east. Noon survives every real offset.
 *
 * `setDay` normalises to the start of the day anyway, so the hour never reaches the store.
 */
function dayFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function PublicBookingFlow({ provider }: PublicBookingFlowProps) {
  const t = useCopy();
  const copy = t.publicBooking;
  const step = usePublicBookingStore((state) => state.step);
  const serviceIds = usePublicBookingStore((state) => state.serviceIds);
  const day = usePublicBookingStore((state) => state.day);
  const slots = usePublicBookingStore((state) => state.slots);
  const nextAvailableDate = usePublicBookingStore((state) => state.nextAvailableDate);
  const selectedSlot = usePublicBookingStore((state) => state.selectedSlot);
  const status = usePublicBookingStore((state) => state.status);
  const error = usePublicBookingStore((state) => state.error);
  const toggleService = usePublicBookingStore((state) => state.toggleService);
  const confirmServices = usePublicBookingStore((state) => state.confirmServices);
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

  /** What is in the basket, in the order it was picked. */
  const selected = useMemo(
    () =>
      serviceIds
        .map((id) => provider.services.find((item) => item.id === id))
        .filter((item) => item !== undefined),
    [provider.services, serviceIds],
  );

  const visitName = selected.map((item) => item.name).join(' + ');
  const totalMinutes = selected.reduce((sum, item) => sum + item.durationMinutes, 0);
  const totalPrice = selected.reduce((sum, item) => sum + item.priceCents, 0);
  const currency = selected[0]?.currency;

  /**
   * The catalogue under the shop's headings, anything ungrouped last.
   *
   * Built here rather than sent grouped, because a service belongs to one category and
   * the page is the only place that needs them nested.
   */
  const groups = useMemo(() => {
    const named = provider.categories.map((category) => ({
      id: category.id,
      name: category.name,
      services: provider.services.filter((service) => service.categoryId === category.id),
    }));
    const loose = provider.services.filter(
      (service) =>
        !service.categoryId || !provider.categories.some((c) => c.id === service.categoryId),
    );

    return [
      ...named.filter((group) => group.services.length > 0),
      ...(loose.length > 0
        ? [{ id: 'none', name: named.length > 0 ? copy.otherServices : '', services: loose }]
        : []),
    ];
  }, [provider.categories, provider.services, copy]);

  /**
   * Whether one person can do all of it.
   *
   * Checked here so the client is told while they are choosing, rather than after the
   * page asks for times and comes back with an empty grid it cannot explain.
   */
  const nobodyDoesAll = serviceIds.length > 0 && qualifiedFor(provider, serviceIds).length === 0;

  const zoneDiffers = useMemo(() => isDifferentZone(provider.timezone), [provider.timezone]);

  /**
   * An estimate, shown so nobody is surprised. The server decides the real figure — it also
   * applies a minimum — and it is the server's number that gets charged.
   */
  const deposit = useMemo(() => {
    if (!provider.depositPercent) return 0;
    return Math.round((totalPrice * provider.depositPercent) / 100);
  }, [totalPrice, provider.depositPercent]);

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
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">{copy.pickServices}</p>

        {/*
          `<details>` rather than a JavaScript accordion: it opens and closes, takes the
          keyboard and announces its state with no code and no dependency. The first
          heading starts open so the page never looks like a list of closed boxes.
        */}
        {groups.map((group, index) => (
          <details
            key={group.id}
            open={groups.length === 1 || index === 0}
            className="overflow-hidden rounded-xl bg-sheet/60 ring-1 ring-hairline"
          >
            {group.name ? (
              <summary
                className={cn(
                  'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3',
                  'font-medium text-brand-900 marker:hidden hover:bg-brand-700/6',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-brand-600',
                )}
              >
                {group.name}
                <span className="text-xs text-ink-muted">
                  {t.categories.serviceCount(group.services.length)}
                </span>
              </summary>
            ) : null}

            <ul className="flex flex-col divide-y divide-hairline/60 border-t border-hairline/60">
              {group.services.map((item) => {
                const checked = serviceIds.includes(item.id);
                return (
                  <li key={item.id}>
                    {/*
                      The whole row is the label, so the tap target is the row — tied by
                      `htmlFor` rather than by wrapping, because the control Radix renders
                      is a button, and a wrapped label does not reliably drive one.
                    */}
                    <label
                      htmlFor={`service-${item.id}`}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors',
                        checked ? 'bg-brand-700/8' : 'hover:bg-brand-700/4',
                      )}
                    >
                      <Checkbox
                        id={`service-${item.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleService(item.id)}
                        className="mt-0.5"
                      />
                      <span className="flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-medium text-brand-900">{item.name}</span>
                          <span className="shrink-0 tabular-nums text-brand-900">
                            {formatMoney(item.priceCents, item.currency)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-muted">
                          {formatDuration(item.durationMinutes)}
                          {item.description ? ` · ${item.description}` : ''}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}

        {/* Said while they are still choosing, not after an empty grid of times. */}
        {nobodyDoesAll ? (
          <p role="alert" className="rounded-lg bg-warn/12 px-3 py-2 text-sm text-warn-ink">
            {copy.nobodyDoesAll}
          </p>
        ) : null}

        {selected.length > 0 ? (
          <div className="sticky bottom-3 flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 shadow-lg ring-1 ring-hairline">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-ink-muted">
                {copy.chosenCount(selected.length)} · {formatDuration(totalMinutes)}
              </span>
              <span className="font-medium tabular-nums text-brand-900">
                {formatMoney(totalPrice, currency)}
              </span>
            </div>
            <Button fullWidth disabled={nobodyDoesAll} onClick={() => void confirmServices()}>
              {copy.continueToTimes}
            </Button>
          </div>
        ) : null}
      </div>
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
          .filter((person) => qualifiedFor(provider, serviceIds).includes(person.id))
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
          <Badge variant="brand">{visitName}</Badge>
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
          /*
            An empty day used to end here, with "try another" and no way to know which. The
            server names the next day that has anything, so the dead end becomes one sentence
            and one button.

            **It offers rather than jumps.** Moving the date under somebody who is mid-decision
            is the kind of helpfulness that reads as a bug — and the page would then be showing
            a different day from the one they picked, with nothing saying why.

            Falls back to the old line whenever the date is unknown, which covers nothing
            within the horizon and the lookup having failed. Both mean the same thing here.
          */
          <div className="rounded-lg bg-brand-900/4 px-3 py-6 text-center">
            <p className="text-sm text-ink-muted">
              {nextAvailableDate
                ? copy.nextFreeDay(zonedDate(dayFromKey(nextAvailableDate), provider.timezone))
                : copy.nothingFree}
            </p>
            {nextAvailableDate ? (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => void setDay(dayFromKey(nextAvailableDate))}
              >
                {copy.goToNextFreeDay}
              </Button>
            ) : null}
          </div>
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
        <p className="font-medium text-brand-900">{visitName}</p>
        <p className="text-sm text-ink-muted">
          {formatDuration(totalMinutes)} · {formatMoney(totalPrice, currency)}
        </p>
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
          {copy.depositLead(formatMoney(deposit, currency))} {copy.depositHow}
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
