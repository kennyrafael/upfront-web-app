import { useEffect, useState } from 'react';
import { BookingCalendar, BookingFormDialog, Button, DashboardLayout } from '@/components';
import type { Booking } from '@/lib/api';
import { formatWeekRange, startOfWeek } from '@/lib/utils';
import { useBookingStore, useProviderStore } from '@/stores';

export function BookingsPage() {
  const load = useBookingStore((state) => state.load);
  const weekStart = useBookingStore((state) => state.weekStart);
  const shiftWeek = useBookingStore((state) => state.shiftWeek);
  const goToWeek = useBookingStore((state) => state.goToWeek);
  const error = useBookingStore((state) => state.error);
  const loadProfile = useProviderStore((state) => state.load);
  const timezone = useProviderStore((state) => state.profile?.timezone);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Booking>();
  const [initialStart, setInitialStart] = useState<Date>();

  useEffect(() => {
    void load();
    // The calendar shades working hours, so it needs the profile as well as the bookings.
    void loadProfile();
  }, [load, loadProfile]);

  function openCreate(start?: Date) {
    setEditing(undefined);
    setInitialStart(start);
    setDialogOpen(true);
  }

  const isThisWeek = weekStart.getTime() === startOfWeek(new Date()).getTime();

  return (
    <DashboardLayout
      title="Bookings"
      description={`Week of ${formatWeekRange(weekStart)}${timezone ? ` · ${timezone}` : ''}`}
      actions={<Button onClick={() => openCreate()}>New booking</Button>}
    >
      <div className="mb-4 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => void shiftWeek(-1)}>
          ← Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isThisWeek}
          onClick={() => void goToWeek(new Date())}
        >
          This week
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void shiftWeek(1)}>
          Next →
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-600/8 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <BookingCalendar
        onSelect={(booking) => {
          setEditing(booking);
          setInitialStart(undefined);
          setDialogOpen(true);
        }}
        onCreateAt={openCreate}
      />

      <p className="mt-3 text-xs text-ink-muted">
        Click an empty slot to book it, or a booking to edit it. Shaded bands are your working
        hours.
      </p>

      <BookingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        booking={editing}
        initialStart={initialStart}
      />
    </DashboardLayout>
  );
}
