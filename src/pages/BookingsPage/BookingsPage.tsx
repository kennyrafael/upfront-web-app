import { useEffect, useMemo, useState } from 'react';
import {
  BookingCalendar,
  BookingFormDialog,
  Button,
  ChargeBalanceDialog,
  DashboardLayout,
  Select,
} from '@/components';
import { useCopy } from '@/lib';
import type { Booking } from '@/lib/api';
import { formatDayHeading, formatWeekRange, startOfWeek } from '@/lib/utils';
import { useAuthStore, useBookingStore, useBusinessStore, useEmployeeStore } from '@/stores';

export function BookingsPage() {
  const copy = useCopy();
  const load = useBookingStore((state) => state.load);
  const weekStart = useBookingStore((state) => state.weekStart);
  const view = useBookingStore((state) => state.view);
  const day = useBookingStore((state) => state.day);
  const weekEmployeeId = useBookingStore((state) => state.weekEmployeeId);
  const setView = useBookingStore((state) => state.setView);
  const setWeekEmployee = useBookingStore((state) => state.setWeekEmployee);
  const shiftWeek = useBookingStore((state) => state.shiftWeek);
  const goToWeek = useBookingStore((state) => state.goToWeek);
  const shiftDay = useBookingStore((state) => state.shiftDay);
  const goToDay = useBookingStore((state) => state.goToDay);
  const error = useBookingStore((state) => state.error);

  const loadProfile = useBusinessStore((state) => state.load);
  const timezone = useBusinessStore((state) => state.profile?.timezone);
  const people = useEmployeeStore((state) => state.items);
  const loadPeople = useEmployeeStore((state) => state.load);
  const me = useAuthStore((state) => state.user);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Booking>();
  const [initialStart, setInitialStart] = useState<Date>();
  const [initialEmployeeId, setInitialEmployeeId] = useState<string>();
  const [charging, setCharging] = useState<Booking>();

  useEffect(() => {
    void load();
    // The calendar shades working hours, so it needs the profile as well as the bookings.
    void loadProfile();
    void loadPeople();
  }, [load, loadProfile, loadPeople]);

  /**
   * Staff see their own week and are not offered the picker.
   *
   * The server already narrows what they receive, so this is not a control — it is not
   * offering a choice whose only options are themselves and nothing.
   */
  const isStaff = me?.role === 'staff';
  useEffect(() => {
    if (isStaff && me?.employeeId) setWeekEmployee(me.employeeId);
  }, [isStaff, me?.employeeId, setWeekEmployee]);

  const employeeOptions = useMemo(
    () => [
      { value: 'all', label: copy.bookings.everyone },
      ...people.map((employee) => ({ value: employee.id, label: employee.name })),
    ],
    // `copy` too, or "Everyone" stays in whichever language was showing when `people` last
    // changed.
    [people, copy],
  );

  function openCreate(start?: Date, employeeId?: string) {
    setEditing(undefined);
    setInitialStart(start);
    setInitialEmployeeId(employeeId);
    setDialogOpen(true);
  }

  const isThisWeek = weekStart.getTime() === startOfWeek(new Date()).getTime();
  const isToday = day.toDateString() === new Date().toDateString();

  return (
    <DashboardLayout
      title={copy.bookings.title}
      description={
        view === 'week'
          ? `${copy.bookings.weekOf(formatWeekRange(weekStart))}${timezone ? ` · ${timezone}` : ''}`
          : `${formatDayHeading(day)}${timezone ? ` · ${timezone}` : ''}`
      }
      actions={<Button onClick={() => openCreate()}>{copy.bookings.newBooking}</Button>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Week or day, because those are the two questions: how is one person's week, and
            who is doing what today. A week of five people does not fit on a screen. */}
        <div className="flex items-center gap-1 rounded-lg bg-sheet/60 p-0.5 ring-1 ring-hairline">
          <Button
            variant={view === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('week')}
          >
            {copy.bookings.week}
          </Button>
          <Button
            variant={view === 'day' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setView('day')}
          >
            {copy.bookings.day}
          </Button>
        </div>

        {view === 'week' ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => void shiftWeek(-1)}>
              {copy.bookings.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isThisWeek}
              onClick={() => void goToWeek(new Date())}
            >
              {copy.bookings.thisWeek}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void shiftWeek(1)}>
              {copy.bookings.next}
            </Button>

            {!isStaff && people.length > 1 ? (
              <Select
                aria-label={copy.bookings.whoseWeek}
                options={employeeOptions}
                value={weekEmployeeId ?? 'all'}
                onValueChange={(value) => setWeekEmployee(value === 'all' ? undefined : value)}
              />
            ) : null}
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => void shiftDay(-1)}>
              {copy.bookings.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isToday}
              onClick={() => void goToDay(new Date())}
            >
              {copy.bookings.today}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void shiftDay(1)}>
              {copy.bookings.next}
            </Button>
          </>
        )}
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      <BookingCalendar
        onSelect={(booking) => {
          setEditing(booking);
          setInitialStart(undefined);
          setInitialEmployeeId(undefined);
          setDialogOpen(true);
        }}
        onCreateAt={openCreate}
      />

      <p className="mt-3 text-ink-muted text-xs">
        {view === 'day' ? copy.bookings.dayHint : copy.bookings.weekHint}
      </p>

      <BookingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        booking={editing}
        initialStart={initialStart}
        initialEmployeeId={initialEmployeeId}
        onCompleted={setCharging}
      />

      {/* Opened by "mark completed" rather than sitting in a menu: the client is standing
          there for about a minute, and that is the window this whole feature lives in. */}
      <ChargeBalanceDialog
        open={Boolean(charging)}
        onOpenChange={(next) => !next && setCharging(undefined)}
        booking={charging}
      />
    </DashboardLayout>
  );
}
