import { type FormEvent, useEffect, useState } from 'react';
import { Button, Label, Switch } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { Employee, TimeOff } from '@/lib/api';
import { useEmployeeStore } from '@/stores';

/**
 * One shared empty array, not a fresh one per render.
 *
 * `state.timeOff[id] ?? []` inside a selector allocates a new array every time the store is
 * read, so zustand sees a changed snapshot on every render and re-renders forever. React
 * says so as "getSnapshot should be cached", then "maximum update depth exceeded". It
 * typechecks, lints and builds perfectly.
 */
const NONE: TimeOff[] = [];

interface TimeOffPanelProps {
  employee: Employee;
  timezone: string;
  onClose: () => void;
}

/** `2026-10-02` plus `09:00` as a real instant, or null when either is missing. */
function toInstant(date: string, time: string): Date | null {
  if (!date) return null;
  const parsed = new Date(`${date}T${time || '00:00'}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function describe(entry: { startsAt: string; endsAt: string; allDay: boolean }, timezone: string) {
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
  });
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const from = new Date(entry.startsAt);
  const to = new Date(entry.endsAt);
  const sameDay = day.format(from) === day.format(to);

  if (entry.allDay) {
    return sameDay ? day.format(from) : `${day.format(from)} – ${day.format(to)}`;
  }
  return sameDay
    ? `${day.format(from)}, ${clock.format(from)}–${clock.format(to)}`
    : `${day.format(from)} ${clock.format(from)} – ${day.format(to)} ${clock.format(to)}`;
}

/** One instant, for a clash — which carries a start and no end, so it is not a range. */
function at(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

/**
 * When somebody is away.
 *
 * All-day is the common case by a distance — a holiday, a sick day — so it is the default
 * and the times only appear when it is switched off. Asking for four fields to say "Tuesday"
 * is how a feature people need daily becomes one they avoid.
 */
export function TimeOffPanel({ employee, timezone, onClose }: TimeOffPanelProps) {
  const copy = useCopy();
  const entries = useEmployeeStore((state) => state.timeOff[employee.id]) ?? NONE;
  const clashes = useEmployeeStore((state) => state.lastClashes);
  const status = useEmployeeStore((state) => state.status);
  const load = useEmployeeStore((state) => state.loadTimeOff);
  const add = useEmployeeStore((state) => state.addTimeOff);
  const remove = useEmployeeStore((state) => state.removeTimeOff);
  const clearClashes = useEmployeeStore((state) => state.clearClashes);

  const [allDay, setAllDay] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('18:00');
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    clearClashes();
    void load(employee.id);
  }, [employee.id, load, clearClashes]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startsAt = toInstant(fromDate, allDay ? '00:00' : fromTime);
    // An all-day range ends at midnight *after* the last day, so the whole of it is covered.
    const endDay = toDate || fromDate;
    const endsAt = allDay ? toInstant(endDay, '00:00') : toInstant(endDay, toTime);

    if (!startsAt || !endsAt) {
      setProblem(copy.people.pickDays);
      return;
    }
    if (allDay) endsAt.setDate(endsAt.getDate() + 1);

    if (endsAt <= startsAt) {
      setProblem(copy.people.endAfterStart);
      return;
    }
    setProblem(undefined);

    if (
      await add(employee.id, {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        allDay,
      })
    ) {
      setFromDate('');
      setToDate('');
    }
  }

  const busy = status === 'saving';

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-sheet/50 p-3 ring-1 ring-hairline">
      <p className="text-sm text-ink-muted">{copy.people.awayFor(employee.name)}</p>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <Switch id={`all-day-${employee.id}`} checked={allDay} onCheckedChange={setAllDay} />
          <Label htmlFor={`all-day-${employee.id}`}>{copy.people.wholeDays}</Label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label={copy.people.from}
            type="date"
            required
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <FormField
            label={copy.people.to}
            type="date"
            hint={copy.people.toHint}
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
          {allDay ? null : (
            <>
              <FormField
                label={copy.people.fromTime}
                type="time"
                value={fromTime}
                onChange={(event) => setFromTime(event.target.value)}
              />
              <FormField
                label={copy.people.toTime}
                type="time"
                value={toTime}
                onChange={(event) => setToTime(event.target.value)}
              />
            </>
          )}
        </div>

        {problem ? (
          <p role="alert" className="text-sm text-danger-ink">
            {problem}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" loading={busy}>
            {copy.people.markAway}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {copy.common.done}
          </Button>
        </div>
      </form>

      {clashes.length > 0 ? (
        /* Said out loud rather than swallowed. Nothing was cancelled, and somebody has to
           call these clients — the app is not going to decide that for them. */
        <div role="alert" className="rounded-lg bg-warn/12 px-3 py-2 text-sm text-warn-ink">
          <p className="font-medium">{copy.people.clashes(clashes.length)}</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {clashes.map((clash) => (
              <li key={clash.id}>
                {at(clash.startsAt, timezone)}
                {clash.clientName ? ` · ${clash.clientName}` : ''}
              </li>
            ))}
          </ul>
          <p className="mt-1">{copy.people.nothingCancelled}</p>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink">
                {describe(entry, timezone)}
                {entry.reason ? <span className="text-ink-muted"> · {entry.reason}</span> : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void remove(employee.id, entry.id)}
              >
                {copy.hours.remove}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">{copy.people.noneAhead}</p>
      )}
    </div>
  );
}
