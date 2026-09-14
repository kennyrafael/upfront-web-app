import { Button, Input, Label } from '@/components/atoms';
import type { WorkingHours } from '@/lib/api';
import { cn, WEEKDAY_OPTIONS } from '@/lib/utils';

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
          No working hours set. Clients can still be booked manually, but availability checks will
          have nothing to compare against.
        </p>
      ) : null}

      {value.map((slot, index) => (
        <div
          // Slots are reorderable only by add/remove and rows are positional, so the
          // index is the stable identity here.
          // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id of their own
          key={index}
          className="flex flex-wrap items-end gap-2 rounded-xl bg-white/50 p-3 ring-1 ring-hairline"
        >
          <div className="flex min-w-36 flex-1 flex-col gap-1.5">
            <Label htmlFor={`slot-${index}-weekday`}>Day</Label>
            {/* A native select keeps the row compact and keyboard-native inside a form. */}
            <select
              id={`slot-${index}-weekday`}
              value={String(slot.weekday)}
              disabled={disabled}
              onChange={(event) => updateSlot(index, { weekday: Number(event.target.value) })}
              className={cn(
                'h-10 rounded-lg bg-white/60 px-3 text-sm text-ink ring-1 ring-inset ring-hairline',
                'transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600',
              )}
            >
              {WEEKDAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex w-28 flex-col gap-1.5">
            <Label htmlFor={`slot-${index}-start`}>From</Label>
            <Input
              id={`slot-${index}-start`}
              type="time"
              value={slot.start}
              disabled={disabled}
              onChange={(event) => updateSlot(index, { start: event.target.value })}
            />
          </div>

          <div className="flex w-28 flex-col gap-1.5">
            <Label htmlFor={`slot-${index}-end`}>To</Label>
            <Input
              id={`slot-${index}-end`}
              type="time"
              value={slot.end}
              disabled={disabled}
              onChange={(event) => updateSlot(index, { end: event.target.value })}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}

      <div>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={addSlot}>
          Add hours
        </Button>
      </div>
    </div>
  );
}
