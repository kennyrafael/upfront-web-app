import { useMemo } from 'react';
import { Card, Spinner } from '@/components/atoms';
import { type Booking, type BookingStatus, describeBooking } from '@/lib/api';
import {
  addDays,
  cn,
  formatDayHeading,
  formatTime,
  isSameDay,
  minutesSinceMidnight,
} from '@/lib/utils';
import { useBookingStore, useProviderStore } from '@/stores';

export interface BookingCalendarProps {
  onSelect: (booking: Booking) => void;
  /** Called with the clicked slot's start, for "book this gap" from the grid. */
  onCreateAt: (start: Date) => void;
}

/** Pixels per hour. Tall enough that a 30-minute booking still reads as a block. */
const HOUR_HEIGHT = 56;
const SLOT_MINUTES = 30;
const FALLBACK_RANGE = { start: 8 * 60, end: 20 * 60 };

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-500/18 ring-amber-600/30 text-amber-900 hover:bg-amber-500/26',
  confirmed: 'bg-brand-700/16 ring-brand-700/30 text-brand-900 hover:bg-brand-700/24',
  completed: 'bg-brand-900/10 ring-brand-900/20 text-brand-900 hover:bg-brand-900/16',
  cancelled: 'bg-slate-500/10 ring-slate-500/20 text-slate-600 line-through hover:bg-slate-500/16',
  no_show: 'bg-red-600/12 ring-red-700/25 text-red-900 hover:bg-red-600/20',
  // Never rendered — see HIDDEN_FROM_CALENDAR — but the map must be total.
  expired: 'hidden',
};

/**
 * Statuses that never appear on the week grid.
 *
 * An expired booking is a slot that was held for a deposit nobody paid. It is not an
 * appointment that was cancelled, it is one that never existed — and drawing it puts a dead
 * block on the provider's calendar for every abandoned attempt. With a public booking page
 * that is most of them.
 *
 * `cancelled` still shows: somebody really did have that appointment and called it off,
 * which is history worth seeing.
 */
const HIDDEN_FROM_CALENDAR: BookingStatus[] = ['expired'];

export function BookingCalendar({ onSelect, onCreateAt }: BookingCalendarProps) {
  const bookings = useBookingStore((state) => state.items);
  const weekStart = useBookingStore((state) => state.weekStart);
  const status = useBookingStore((state) => state.status);
  const workingHours = useProviderStore((state) => state.profile?.workingHours);

  const visible = useMemo(
    () => bookings.filter((booking) => !HIDDEN_FROM_CALENDAR.includes(booking.status)),
    [bookings],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  // The visible band covers the working week, widened to include any booking that
  // falls outside it — an out-of-hours booking must never be invisible.
  const range = useMemo(() => {
    const bounds = { start: Number.POSITIVE_INFINITY, end: Number.NEGATIVE_INFINITY };

    for (const slot of workingHours ?? []) {
      bounds.start = Math.min(bounds.start, toMinutes(slot.start));
      bounds.end = Math.max(bounds.end, toMinutes(slot.end));
    }
    for (const booking of visible) {
      bounds.start = Math.min(bounds.start, minutesSinceMidnight(new Date(booking.startsAt)));
      bounds.end = Math.max(bounds.end, minutesSinceMidnight(new Date(booking.endsAt)) || 24 * 60);
    }

    if (!Number.isFinite(bounds.start) || !Number.isFinite(bounds.end)) return FALLBACK_RANGE;

    return {
      start: Math.max(0, Math.floor(bounds.start / 60) * 60 - 60),
      end: Math.min(24 * 60, Math.ceil(bounds.end / 60) * 60 + 60),
    };
  }, [workingHours, visible]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let minute = range.start; minute < range.end; minute += 60) list.push(minute);
    return list;
  }, [range]);

  const gridHeight = ((range.end - range.start) / 60) * HOUR_HEIGHT;
  const today = new Date();

  return (
    <Card className="overflow-hidden">
      {status === 'loading' ? (
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2 text-xs text-ink-muted">
          <Spinner className="size-3 text-brand-700" /> Loading week…
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="min-w-3xl">
          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-hairline">
            <div />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  'px-2 py-2 text-center text-xs font-medium',
                  isSameDay(day, today) ? 'text-brand-800' : 'text-ink-muted',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5',
                    isSameDay(day, today) && 'bg-brand-700/12',
                  )}
                >
                  {formatDayHeading(day)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((minute) => (
                <div
                  key={minute}
                  className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-ink-muted"
                  style={{ top: ((minute - range.start) / 60) * HOUR_HEIGHT }}
                >
                  {String(Math.floor(minute / 60)).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              <DayColumn
                key={day.toISOString()}
                day={day}
                range={range}
                hours={hours}
                height={gridHeight}
                bookings={visible.filter((booking) => isSameDay(new Date(booking.startsAt), day))}
                workingMinutes={(workingHours ?? [])
                  .filter((slot) => slot.weekday === day.getDay())
                  .map((slot) => ({ start: toMinutes(slot.start), end: toMinutes(slot.end) }))}
                onSelect={onSelect}
                onCreateAt={onCreateAt}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface DayColumnProps {
  day: Date;
  range: { start: number; end: number };
  hours: number[];
  height: number;
  bookings: Booking[];
  workingMinutes: { start: number; end: number }[];
  onSelect: (booking: Booking) => void;
  onCreateAt: (start: Date) => void;
}

function DayColumn({
  day,
  range,
  hours,
  height,
  bookings,
  workingMinutes,
  onSelect,
  onCreateAt,
}: DayColumnProps) {
  const slots = useMemo(() => {
    const list: number[] = [];
    for (let minute = range.start; minute < range.end; minute += SLOT_MINUTES) list.push(minute);
    return list;
  }, [range]);

  return (
    <div className="relative border-l border-hairline" style={{ height }}>
      {/* Working hours are tinted, not lightened: the panel is already near-white, so a
          lighter band was invisible against it. */}
      {workingMinutes.map((slot) => (
        <div
          key={`${slot.start}-${slot.end}`}
          className="absolute inset-x-0 bg-brand-700/8"
          style={{
            top: ((Math.max(slot.start, range.start) - range.start) / 60) * HOUR_HEIGHT,
            height:
              ((Math.min(slot.end, range.end) - Math.max(slot.start, range.start)) / 60) *
              HOUR_HEIGHT,
          }}
        />
      ))}

      {hours.map((minute) => (
        <div
          key={minute}
          className="absolute inset-x-0 border-t border-hairline/70"
          style={{ top: ((minute - range.start) / 60) * HOUR_HEIGHT }}
        />
      ))}

      {slots.map((minute) => {
        const start = new Date(day);
        start.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
        return (
          <button
            key={minute}
            type="button"
            aria-label={`Book ${formatDayHeading(day)} at ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`}
            onClick={() => onCreateAt(start)}
            className="absolute inset-x-0 transition-colors hover:bg-brand-700/8"
            style={{
              top: ((minute - range.start) / 60) * HOUR_HEIGHT,
              height: (SLOT_MINUTES / 60) * HOUR_HEIGHT,
            }}
          />
        );
      })}

      {bookings.map((booking) => {
        const start = new Date(booking.startsAt);
        const end = new Date(booking.endsAt);
        const top = ((minutesSinceMidnight(start) - range.start) / 60) * HOUR_HEIGHT;
        const minutes = Math.max(SLOT_MINUTES / 2, (end.getTime() - start.getTime()) / 60_000);

        return (
          <button
            key={booking.id}
            type="button"
            onClick={() => onSelect(booking)}
            className={cn(
              'absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-left text-[11px] leading-tight',
              'ring-1 ring-inset backdrop-blur-sm transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-700',
              STATUS_STYLES[booking.status],
            )}
            style={{ top, height: (minutes / 60) * HOUR_HEIGHT - 2 }}
          >
            <span className="block truncate font-medium">
              {booking.source === 'public' ? (
                <>
                  {/* Real text rather than an aria-label on a dot: a plain span has no
                      role to hang one on, and this reads correctly to a screen reader. */}
                  <span className="sr-only">Booked online: </span>
                  <span aria-hidden="true" title="Booked by the client online">
                    •{' '}
                  </span>
                </>
              ) : null}
              {booking.client.name}
            </span>
            <span className="block truncate opacity-80">
              {formatTime(start)} · {describeBooking(booking)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
