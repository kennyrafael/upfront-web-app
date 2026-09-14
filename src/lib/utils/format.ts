const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Cents to a localised currency string: 1800 -> "18,00 €". */
export function formatMoney(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(cents / 100);
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
  return WEEKDAY_LABELS[weekday] ?? `Day ${weekday}`;
}

export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, index) => ({
  value: String(index),
  label,
}));

/** "31 Mar 2026" from an ISO instant — recibo dates are read, not computed with. */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
