import { useEffect, useMemo } from 'react';
import { Card, Spinner } from '@/components/atoms';
import { type Booking, type BookingStatus, describeBooking } from '@/lib/api';
import {
  addDays,
  cn,
  formatDayHeading,
  formatTime,
  intersectHours,
  isSameDay,
  minutesSinceMidnight,
} from '@/lib/utils';
import { useBookingStore, useBusinessStore, useEmployeeStore } from '@/stores';

export interface BookingCalendarProps {
  onSelect: (booking: Booking) => void;
  /**
   * Called with the clicked slot's start, and who the column belongs to.
   *
   * The employee is what makes an empty square in the day view mean something specific:
   * clicking under Rui at 11:00 should open a booking for Rui, not for whoever the form
   * happens to default to.
   */
  onCreateAt: (start: Date, employeeId?: string) => void;
}

/** Pixels per hour. Tall enough that a 30-minute booking still reads as a block. */
const HOUR_HEIGHT = 56;
const SLOT_MINUTES = 30;
const FALLBACK_RANGE = { start: 8 * 60, end: 20 * 60 };

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-warn/18 ring-warn/30 text-warn-ink hover:bg-warn/26',
  confirmed: 'bg-brand-700/16 ring-brand-700/30 text-brand-900 hover:bg-brand-700/24',
  completed: 'bg-brand-900/10 ring-brand-900/20 text-brand-900 hover:bg-brand-900/16',
  cancelled: 'bg-ink-muted/10 ring-ink-muted/20 text-ink-muted line-through hover:bg-ink-muted/16',
  no_show: 'bg-danger/12 ring-danger/25 text-danger-ink hover:bg-danger/20',
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
  const view = useBookingStore((state) => state.view);
  const day = useBookingStore((state) => state.day);
  const weekEmployeeId = useBookingStore((state) => state.weekEmployeeId);
  const status = useBookingStore((state) => state.status);
  const shopHours = useBusinessStore((state) => state.profile?.hours);
  const people = useEmployeeStore((state) => state.items);
  const loadPeople = useEmployeeStore((state) => state.load);

  useEffect(() => {
    void loadPeople();
  }, [loadPeople]);

  const visible = useMemo(
    () => bookings.filter((booking) => !HIDDEN_FROM_CALENDAR.includes(booking.status)),
    [bookings],
  );

  /**
   * The week view is one person at a time, filtered here rather than at the fetch.
   *
   * The whole week is already in memory for the day view, so switching person is instant and
   * costs no request. A week of everybody is still possible — and is what a one-person shop
   * gets, since there is nobody to choose between.
   */
  const weekBookings = useMemo(
    () =>
      weekEmployeeId
        ? visible.filter((booking) =>
            booking.items.some((item) => item.employeeId === weekEmployeeId),
          )
        : visible,
    [visible, weekEmployeeId],
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  /**
   * Columns for the day view: everybody working that day, and nobody who is not.
   *
   * A column for somebody on holiday is a column of dead space, and with five people the
   * grid is tight enough already. Somebody with an appointment that day is kept whatever
   * their hours say — it is on the calendar, so it has to be reachable.
   */
  const columnsForDay = useMemo(() => {
    const onThatDay = people.filter((employee) => {
      const effective = intersectHours(shopHours ?? [], employee.hours);
      const working = effective.some((slot) => slot.weekday === day.getDay());
      const booked = visible.some(
        (booking) =>
          isSameDay(new Date(booking.startsAt), day) &&
          booking.items.some((item) => item.employeeId === employee.id),
      );
      return working || booked;
    });

    // Everybody, rather than an empty grid, when the shop has set no hours at all.
    return onThatDay.length > 0 ? onThatDay : people;
  }, [people, shopHours, day, visible]);

  // The visible band covers the working week, widened to include any booking that
  // falls outside it — an out-of-hours booking must never be invisible.
  const range = useMemo(() => {
    const bounds = { start: Number.POSITIVE_INFINITY, end: Number.NEGATIVE_INFINITY };

    for (const slot of shopHours ?? []) {
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
  }, [shopHours, visible]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let minute = range.start; minute < range.end; minute += 60) list.push(minute);
    return list;
  }, [range]);

  const gridHeight = ((range.end - range.start) / 60) * HOUR_HEIGHT;
  const today = new Date();

  /**
   * The columns, whichever view is on.
   *
   * Both views are the same grid with a different set of columns — seven days of one person,
   * or one day of several people — so they share `TimeColumn` rather than growing a second
   * copy of the geometry that would drift from this one.
   */
  const columns =
    view === 'week'
      ? days.map((d) => ({
          key: d.toISOString(),
          heading: formatDayHeading(d),
          highlight: isSameDay(d, today),
          day: d,
          employeeId: weekEmployeeId,
          bookings: weekBookings.filter((booking) => isSameDay(new Date(booking.startsAt), d)),
          hours: intersectHours(
            shopHours ?? [],
            people.find((employee) => employee.id === weekEmployeeId)?.hours ?? [],
          ).filter((slot) => slot.weekday === d.getDay()),
        }))
      : columnsForDay.map((employee) => ({
          key: employee.id,
          heading: employee.name,
          highlight: false,
          day,
          employeeId: employee.id,
          bookings: visible.filter(
            (booking) =>
              isSameDay(new Date(booking.startsAt), day) &&
              booking.items.some((item) => item.employeeId === employee.id),
          ),
          hours: intersectHours(shopHours ?? [], employee.hours).filter(
            (slot) => slot.weekday === day.getDay(),
          ),
        }));

  return (
    <Card className="overflow-hidden">
      {status === 'loading' ? (
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-2 text-xs text-ink-muted">
          <Spinner className="size-3 text-brand-700" /> Loading…
        </div>
      ) : null}

      <div className="overflow-x-auto">
        {/* Wide enough that columns stay readable; past about six people the grid scrolls
            sideways rather than squeezing names into nothing. */}
        <div className="min-w-3xl">
          <div
            className="grid border-b border-hairline"
            style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(7rem, 1fr))` }}
          >
            <div />
            {columns.map((column) => (
              <div
                key={column.key}
                className={cn(
                  'truncate px-2 py-2 text-center font-medium text-xs',
                  column.highlight ? 'text-brand-800' : 'text-ink-muted',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5',
                    column.highlight && 'bg-brand-700/12',
                  )}
                >
                  {column.heading}
                </span>
              </div>
            ))}
          </div>

          <div
            className="grid"
            style={{ gridTemplateColumns: `3.5rem repeat(${columns.length}, minmax(7rem, 1fr))` }}
          >
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((minute) => (
                <div
                  key={minute}
                  className="-translate-y-1/2 absolute right-2 text-[11px] text-ink-muted tabular-nums"
                  style={{ top: ((minute - range.start) / 60) * HOUR_HEIGHT }}
                >
                  {String(Math.floor(minute / 60)).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {columns.map((column) => (
              <DayColumn
                key={column.key}
                day={column.day}
                range={range}
                hours={hours}
                height={gridHeight}
                bookings={column.bookings}
                workingMinutes={column.hours.map((slot) => ({
                  start: toMinutes(slot.start),
                  end: toMinutes(slot.end),
                }))}
                label={column.heading}
                onSelect={onSelect}
                onCreateAt={(start) => onCreateAt(start, column.employeeId)}
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
  /** What this column is: a weekday in the week view, a person's name in the day view. */
  label: string;
  onSelect: (booking: Booking) => void;
  onCreateAt: (start: Date, employeeId?: string) => void;
}

function DayColumn({
  day,
  range,
  hours,
  height,
  bookings,
  workingMinutes,
  label,
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
            aria-label={`Book ${label} at ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`}
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
