import { dateFormat, numberFormat } from './intl';

/**
 * A week starting on a Sunday, used only to ask `Intl` what it calls each day.
 *
 * 2024-01-07 was a Sunday. Deriving the names beats keeping seven of them per language:
 * they cannot drift, they capitalise the way each language does, and adding Spanish adds
 * nothing here at all.
 */
const KNOWN_SUNDAY = Date.UTC(2024, 0, 7);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Cents to a localised currency string: 1800 -> "18,00 €". */
export function formatMoney(cents: number, currency = 'EUR'): string {
  return numberFormat({ style: 'currency', currency }).format(cents / 100);
}

/** Cents to a bare editable amount: 1800 -> "18.00". */
export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Parses "18", "18.5" or "18,50" into cents. Returns null when unparseable. */
export function amountToCents(amount: string): number | null {
  const normalised = amount.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) return null;
  return Math.round(Number(normalised) * 100);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function weekdayLabel(weekday: number): string {
  return dateFormat({ weekday: 'long' }, 'UTC').format(new Date(KNOWN_SUNDAY + weekday * DAY_MS));
}

/**
 * A function now, not a constant.
 *
 * It used to be a module-level array, which is exactly the shape that cannot follow a
 * language change — it would have been built once, in whatever locale happened to be
 * active at import time, and then been wrong for the rest of the session.
 */
export function weekdayOptions(): { value: string; label: string }[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    value: String(weekday),
    label: weekdayLabel(weekday),
  }));
}

/** "31 Mar 2026" from an ISO instant — recibo dates are read, not computed with. */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return dateFormat({ day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
