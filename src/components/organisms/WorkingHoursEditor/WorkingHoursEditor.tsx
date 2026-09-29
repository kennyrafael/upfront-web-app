import { Button, Icon, Input, Label, Select } from '@/components/atoms';
import { useCopy } from '@/lib';
import type { WorkingHours } from '@/lib/api';
import { weekdayOptions } from '@/lib/utils';

export interface WorkingHoursEditorProps {
  value: WorkingHours[];
  onChange: (value: WorkingHours[]) => void;
  disabled?: boolean;
}

const DEFAULT_SLOT = { start: '09:00', end: '18:00' };

/**
 * One row per slot rather than a grid: providers routinely split a day (lunch break),
 * and a grid would have to special-case that.
 */
export function WorkingHoursEditor({ value, onChange, disabled }: WorkingHoursEditorProps) {
  const copy = useCopy();
  function updateSlot(index: number, patch: Partial<WorkingHours>) {
    onChange(value.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    const lastWeekday = value.at(-1)?.weekday ?? 0;
    onChange([...value, { weekday: lastWeekday || 1, ...DEFAULT_SLOT }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <p className="rounded-lg bg-brand-900/4 px-3 py-3 text-sm text-ink-muted">
          {copy.hours.noneSet}
        </p>
      ) : null}

      {value.map((slot, index) => (
        <div
          // Slots are reorderable only by add/remove and rows are positional, so the
          // index is the stable identity here.
          // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id of their own
          key={index}
          // A grid rather than a wrapping flex row, because wrapping chose where to break by
          // arithmetic: at the onboarding width the end time dropped to its own line and took
          // the remove button with it, leaving "to" stranded under "from".
          //
          // Narrow: the day and the remove control share the first line, the two times share
          // the second. Wide: all four in a line, the shape this always meant to be.
          className="grid grid-cols-[1fr_1fr_auto] items-end gap-x-2 gap-y-3 rounded-xl bg-sheet/50 p-3 ring-1 ring-hairline sm:grid-cols-[11rem_7rem_7rem_auto]"
        >
          {/* A fixed width at the wide breakpoint, not `flex-1`: a weekday name is short, and
              letting the column grow gave it six hundred pixels for the word "Wednesday". */}
          <div className="col-span-2 col-start-1 row-start-1 flex flex-col gap-1.5 sm:col-span-1">
            <Label htmlFor={`slot-${index}-weekday`}>{copy.hours.day}</Label>
            <Select
              id={`slot-${index}-weekday`}
              options={weekdayOptions()}
              value={String(slot.weekday)}
              disabled={disabled}
              onValueChange={(weekday) => updateSlot(index, { weekday: Number(weekday) })}
            />
          </div>

          <div className="col-start-1 row-start-2 flex flex-col gap-1.5 sm:col-start-2 sm:row-start-1">
            <Label htmlFor={`slot-${index}-start`}>{copy.hours.from}</Label>
            <Input
              id={`slot-${index}-start`}
              type="time"
              value={slot.start}
              disabled={disabled}
              onChange={(event) => updateSlot(index, { start: event.target.value })}
            />
          </div>

          <div className="col-start-2 row-start-2 flex flex-col gap-1.5 sm:col-start-3 sm:row-start-1">
            <Label htmlFor={`slot-${index}-end`}>{copy.hours.to}</Label>
            <Input
              id={`slot-${index}-end`}
              type="time"
              value={slot.end}
              disabled={disabled}
              onChange={(event) => updateSlot(index, { end: event.target.value })}
            />
          </div>

          {/* Sits on the first line beside the day at narrow widths and at the end of the row
              when there is space — `order` moves it without moving it in the DOM, so the tab
              order still ends on the control that destroys the row.
              Centred against the height of a field rather than aligned to its own box: the
              button is shorter than an input, so matching their bottoms leaves it low against
              the line they share. The invisible spacer label this used to need is gone with
              the wrapping flex row. */}
          <div className="col-start-3 row-start-1 flex h-9 items-center justify-end sm:col-start-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              {/* The label is the accessible name, not a tooltip — this is the only control
                  in the row with no text, and it removes a day's hours. */}
              <Icon name="close-circle" label={copy.hours.remove} className="size-5" />
            </Button>
          </div>
        </div>
      ))}

      <div>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={addSlot}>
          {copy.hours.addHours}
        </Button>
      </div>
    </div>
  );
}
