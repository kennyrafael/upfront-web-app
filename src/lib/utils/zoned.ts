import { dateFormat } from './intl';

/**
 * Formatting in a named timezone rather than the browser's.
 *
 * The rest of the app renders in local time, which is right for a provider working on
 * their own machine. The public booking page is different: a client in London choosing
 * "14:00" from a Lisbon provider's calendar must be choosing 14:00 *Lisbon*, or they will
 * turn up an hour out. Everything a visitor sees goes through here, with the zone named
 * on screen so there is no ambiguity.
 *
 * Deliberately separate from `datetime.ts` — those helpers are anchored to the browser and
 * using one here by accident is exactly the bug this file exists to prevent.
 */

export function zonedTime(iso: string, timeZone: string): string {
  // `h23` regardless of locale: a 12-hour clock on a booking page is an invitation to
  // turn up at the wrong end of the day, and Portugal reads 24-hour anyway.
  return dateFormat({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }, timeZone).format(
    new Date(iso),
  );
}

export function zonedDate(iso: string | Date, timeZone: string): string {
  return dateFormat({ weekday: 'long', day: 'numeric', month: 'long' }, timeZone).format(
    typeof iso === 'string' ? new Date(iso) : iso,
  );
}

/**
 * Both, joined the way the language joins them.
 *
 * It used to be `${date} at ${time}`, which is one of the easiest strings in an app to
 * miss: it reads as punctuation rather than as English. Handing both to `Intl` means
 * nobody has to remember that Portuguese says "às".
 */
export function zonedDateTime(iso: string, timeZone: string): string {
  return dateFormat(
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    },
    timeZone,
  ).format(new Date(iso));
}

/**
 * `YYYY-MM-DD` for the calendar date an instant falls on in the given zone.
 *
 * **`en-CA` is load-bearing and must not be localised.** This is not something anybody
 * reads — it is how a date becomes a map key — and `en-CA` is used precisely because it
 * yields ISO-ordered parts. Swapping it for the viewer's locale would produce `07/01/2024`
 * in some languages and silently scatter every booking across the wrong days.
 */
export function zonedDayKey(iso: string | Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(typeof iso === 'string' ? new Date(iso) : iso);

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
}

/** Whether the visitor's own clock differs from the provider's, so the page can say so. */
export function isDifferentZone(timeZone: string): boolean {
  try {
    const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (here === timeZone) return false;

    // Same offset right now is close enough — the warning is about being an hour out,
    // not about the zone having a different name.
    const now = new Date();
    return zonedTime(now.toISOString(), here) !== zonedTime(now.toISOString(), timeZone);
  } catch {
    return false;
  }
}
