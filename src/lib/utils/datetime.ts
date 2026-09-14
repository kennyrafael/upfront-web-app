/**
 * Calendar maths in the browser's local timezone.
 *
 * The API validates working hours in the provider's own timezone. For an Iberian
 * provider working from their own machine those are the same zone; if they ever
 * differ, the grid can show a slot the API then refuses. Rendering in the provider's
 * zone needs a tz-aware date library — worth doing before any multi-timezone use.
 */

export const MINUTES_PER_DAY = 24 * 60;

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  // getDay is 0=Sunday; shift so Monday is the first column.
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** `YYYY-MM-DD`, the value shape an `input[type=date]` expects. */
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `HH:mm`, the value shape an `input[type=time]` expects. */
export function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Combines the two input values back into a local instant. Null when either is malformed. */
export function fromDateTimeInputs(dateValue: string, timeValue: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) return null;

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTime(value: string | Date): string {
  return toTimeInputValue(typeof value === 'string' ? new Date(value) : value);
}

const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' });
const RANGE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const FULL_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function formatDayHeading(date: Date): string {
  return DAY_FORMAT.format(date);
}

export function formatFullDate(date: Date): string {
  return FULL_FORMAT.format(date);
}

/** "1 – 7 Jun 2026", collapsing the month when the week does not straddle one. */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const year = weekEnd.getFullYear();

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()} – ${RANGE_FORMAT.format(weekEnd)} ${year}`;
  }
  return `${RANGE_FORMAT.format(weekStart)} – ${RANGE_FORMAT.format(weekEnd)} ${year}`;
}
