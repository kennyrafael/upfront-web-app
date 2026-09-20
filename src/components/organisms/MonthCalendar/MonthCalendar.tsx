import { useMemo } from 'react';
import { Card, Spinner } from '@/components/atoms';
import { useCopy } from '@/lib';
import type { BookingStatus } from '@/lib/api';
import {
  addDays,
  cn,
  formatDayNumber,
  formatTime,
  isSameDay,
  startOfWeek,
  weekdayLabel,
} from '@/lib/utils';
import { useBookingStore } from '@/stores';

export interface MonthCalendarProps {
  /** Opening a day is the point of the month: it is for finding, the day view is for working. */
  onOpenDay: (day: Date) => void;
}

/** Six weeks, always — a grid that changes height as you page through the year jumps. */
const WEEKS = 6;

/** How many times fit in a cell before the rest becomes a count. */
const SHOWN_PER_DAY = 4;

const STATUS_DOTS: Record<BookingStatus, string> = {
  pending: 'bg-warn',
  confirmed: 'bg-brand-700',
  completed: 'bg-brand-900/50',
  cancelled: 'bg-ink-muted/40',
  no_show: 'bg-danger',
  // Never sent by the summary, but the map must be total.
  expired: 'hidden',
};

/**
 * A month as a density map.
 *
 * Deliberately not a small week view: at 30 appointments a day there is no honest way to
 * draw them in a cell an inch high, and pretending otherwise produces a grid of unreadable
 * slivers. So a cell says how full the day is and shows the first few times; the day view
 * has the rest, one click away.
 */
export function MonthCalendar({ onOpenDay }: MonthCalendarProps) {
  const copy = useCopy();
  const monthStart = useBookingStore((state) => state.monthStart);
  const monthDays = useBookingStore((state) => state.monthDays);
  const status = useBookingStore((state) => state.status);

  const gridStart = useMemo(() => startOfWeek(monthStart), [monthStart]);

  /** The summary keyed by its own day string, which is already in the shop's timezone. */
  const byDay = useMemo(
    () => new Map(monthDays.map((summary) => [summary.day, summary])),
    [monthDays],
  );

  const cells = useMemo(
    () => Array.from({ length: WEEKS * 7 }, (_, index) => addDays(gridStart, index)),
    [gridStart],
  );

  const today = new Date();

  if (status === 'loading' && monthDays.length === 0) {
    return (
      <Card className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-ink-muted">
        <Spinner className="text-brand-ink" /> {copy.common.loading}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-hairline">
        {cells.slice(0, 7).map((day) => (
          <div
            key={day.toISOString()}
            className="px-2 py-2 text-center font-medium text-xs text-ink-muted"
          >
            {weekdayLabel(day.getDay())}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const summary = byDay.get(localKey(day));
          const outside = day.getMonth() !== monthStart.getMonth();
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onOpenDay(day)}
              aria-label={copy.bookings.openDay(formatDayNumber(day), summary?.count ?? 0)}
              className={cn(
                'flex min-h-24 flex-col gap-1 border-hairline/60 border-r border-b p-1.5 text-left',
                'transition-colors hover:bg-brand-700/6',
                'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
                'focus-visible:outline-brand-600',
                // Days from the neighbouring months stay reachable but recede: they are
                // context for the week, not part of the month being read.
                outside && 'bg-sheet/40 text-ink-muted',
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                    isToday ? 'bg-brand-700 font-semibold text-white' : 'text-brand-900',
                    outside && !isToday && 'text-ink-muted',
                  )}
                >
                  {formatDayNumber(day)}
                </span>
                {summary ? (
                  <span className="text-[11px] text-ink-muted tabular-nums">{summary.count}</span>
                ) : null}
              </span>

              {summary?.first.map((entry) => (
                <span
                  key={entry.startsAt}
                  className="flex items-center gap-1 text-[11px] text-ink-muted tabular-nums"
                >
                  <span
                    aria-hidden="true"
                    className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOTS[entry.status])}
                  />
                  {formatTime(entry.startsAt)}
                </span>
              ))}

              {summary && summary.count > SHOWN_PER_DAY ? (
                <span className="text-[11px] text-ink-muted">
                  {copy.bookings.andMore(summary.count - SHOWN_PER_DAY)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * The cell's own date as `YYYY-MM-DD`, built from its local parts.
 *
 * Not `toISOString().slice(0, 10)`, which is UTC: west of Greenwich in summer that is
 * yesterday for every cell, and the whole grid would show each day's bookings one square
 * to the left.
 */
function localKey(day: Date): string {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}
