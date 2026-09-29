import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Icon } from '@/components/atoms';
import { Combobox, FormField, SelectField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { clientsApi } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import { useEmployeeStore, useServiceStore, useWaitlistStore } from '@/stores';

export interface WaitlistPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Fields {
  clientId: string;
  serviceIds: string[];
  employeeId: string;
  fromDate: string;
  toDate: string;
}

/** `YYYY-MM-DD` in the browser's calendar, which is the shop's — the shape the API stores. */
function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The default window: today, and the fortnight after it.
 *
 * A waitlist entry with a long window never effectively expires, and a shop running a year
 * would be texting somebody about a slot they asked for last March. Two weeks is long enough
 * to be useful and short enough that a stale entry ages out rather than accumulating.
 */
function defaultWindow(): { fromDate: string; toDate: string } {
  const today = new Date();
  const later = new Date(today);
  later.setDate(later.getDate() + 14);
  return { fromDate: dayKey(today), toDate: dayKey(later) };
}

function emptyFields(): Fields {
  return { clientId: '', serviceIds: [], employeeId: '', ...defaultWindow() };
}

/**
 * Who is waiting for a slot that was not free, and the form that adds somebody.
 *
 * **It opens from the bookings page rather than living in the sidebar**, because that is
 * where the moment happens: a provider looks for a gap, finds none, and puts the client on
 * the list without leaving the calendar they were reading. A seventh nav item would make it
 * a destination, and nobody sets out to visit a waitlist.
 *
 * The list is short by construction — only `waiting` entries come back, and an entry leaves
 * the moment it is told about an opening.
 */
export function WaitlistPanel({ open, onOpenChange }: WaitlistPanelProps) {
  const copy = useCopy();
  const items = useWaitlistStore((state) => state.items);
  const status = useWaitlistStore((state) => state.status);
  const error = useWaitlistStore((state) => state.error);
  const unavailable = useWaitlistStore((state) => state.unavailable);
  const load = useWaitlistStore((state) => state.load);
  const add = useWaitlistStore((state) => state.add);
  const remove = useWaitlistStore((state) => state.remove);
  const clearError = useWaitlistStore((state) => state.clearError);

  const services = useServiceStore((state) => state.items);
  const loadServices = useServiceStore((state) => state.load);
  const employees = useEmployeeStore((state) => state.items);
  const loadEmployees = useEmployeeStore((state) => state.load);

  const [fields, setFields] = useState<Fields>(emptyFields);
  const [clientLabel, setClientLabel] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    void load();
    void loadServices();
    void loadEmployees();
  }, [open, load, loadServices, loadEmployees]);

  useEffect(() => {
    if (open) return;
    setAdding(false);
    setFields(emptyFields());
    setClientLabel('');
    setErrors({});
    clearError();
  }, [open, clearError]);

  /**
   * How long a freed gap has to be to be worth telling them about, summed from the basket.
   *
   * Sent rather than inferred server-side because it is what the entry *means* — somebody
   * waiting for a two-hour colour should not hear about a cancelled beard trim — and it has
   * to keep meaning that even if the service is later reshaped.
   */
  const durationMinutes = useMemo(
    () =>
      fields.serviceIds.reduce((sum, id) => {
        const service = services.find((candidate) => candidate.id === id);
        return sum + (service?.durationMinutes ?? 0);
      }, 0),
    [fields.serviceIds, services],
  );

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function toggleService(id: string) {
    setFields((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(id)
        ? current.serviceIds.filter((candidate) => candidate !== id)
        : [...current.serviceIds, id],
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof Fields, string>> = {};
    if (!fields.clientId) nextErrors.clientId = copy.waitlist.errorClient;
    if (fields.serviceIds.length === 0) nextErrors.serviceIds = copy.waitlist.errorService;
    // A window that ends before it starts matches nothing, and looks like a broken feature
    // rather than a typo — the entry simply never fires and nobody finds out why.
    if (fields.toDate < fields.fromDate) nextErrors.toDate = copy.waitlist.errorWindow;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const ok = await add({
      clientId: fields.clientId,
      serviceIds: fields.serviceIds,
      employeeId: fields.employeeId || undefined,
      fromDate: fields.fromDate,
      toDate: fields.toDate,
      durationMinutes,
    });

    if (ok) {
      setFields(emptyFields());
      setClientLabel('');
      setAdding(false);
    }
  }

  const busy = status === 'saving';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.waitlist.title}
      description={copy.waitlist.description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {copy.common.close}
          </Button>
          {!unavailable && !adding ? (
            <Button onClick={() => setAdding(true)}>{copy.waitlist.add}</Button>
          ) : null}
          {adding ? (
            <Button type="submit" form="waitlist-form" loading={busy}>
              {copy.waitlist.save}
            </Button>
          ) : null}
        </>
      }
    >
      {unavailable ? (
        // The module is gated on the `waitlist` capability, so this is an answer about their
        // plan rather than a failure — a red error banner would be a lie about it.
        <p className="rounded-lg bg-sheet px-3 py-6 text-center text-ink-muted text-sm">
          {copy.waitlist.notOnYourPlan}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {error ? (
            <p className="rounded-lg bg-danger/12 px-3 py-2 text-danger-ink text-sm">{error}</p>
          ) : null}

          {items.length === 0 && status !== 'loading' ? (
            <p className="rounded-lg bg-sheet px-3 py-6 text-center text-ink-muted text-sm">
              {copy.waitlist.empty}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-sheet px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{entry.clientName}</p>
                    <p className="truncate text-ink-muted text-xs">
                      {entry.services || copy.waitlist.anyService}
                      {' · '}
                      {formatDuration(entry.durationMinutes)}
                    </p>
                    <p className="truncate text-ink-muted text-xs">
                      {copy.waitlist.between(entry.fromDate, entry.toDate)}
                      {' · '}
                      {entry.employeeName ?? copy.waitlist.anyone}
                    </p>
                    {/* The reason a waitlist is a list you ring people from. */}
                    {entry.clientPhone ? (
                      <a
                        className="text-brand-ink text-xs underline"
                        href={`tel:${entry.clientPhone}`}
                      >
                        {entry.clientPhone}
                      </a>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void remove(entry.id)}
                  >
                    <Icon name="close" label={copy.waitlist.removeLabel(entry.clientName)} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {adding ? (
            <form
              id="waitlist-form"
              className="flex flex-col gap-4 border-hairline border-t pt-4"
              onSubmit={handleSubmit}
              noValidate
            >
              <Combobox
                label={copy.waitlist.client}
                required
                placeholder={copy.bookings.searchClient}
                value={fields.clientId || undefined}
                selectedLabel={clientLabel}
                error={errors.clientId}
                loadingMessage={copy.common.searching}
                emptyMessage={copy.bookings.noClientMatch}
                loadOptions={async (term) =>
                  (await clientsApi.search(term)).map((client) => ({
                    value: client.id,
                    label: client.name,
                    detail: client.phone,
                  }))
                }
                onChange={(option) => {
                  setClientLabel(option.label);
                  setField('clientId', option.value);
                }}
              />

              <fieldset className="flex flex-col gap-1">
                <legend className="font-medium text-sm">{copy.waitlist.services}</legend>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-center gap-2 rounded-lg bg-sheet px-3 py-1.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={fields.serviceIds.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
                {errors.serviceIds ? (
                  <p className="text-danger-ink text-xs">{errors.serviceIds}</p>
                ) : null}
                {durationMinutes > 0 ? (
                  <p className="text-ink-muted text-xs">
                    {copy.waitlist.gapNeeded(formatDuration(durationMinutes))}
                  </p>
                ) : null}
              </fieldset>

              <SelectField
                label={copy.waitlist.employee}
                value={fields.employeeId || 'any'}
                onValueChange={(value) => setField('employeeId', value === 'any' ? '' : value)}
                options={[
                  { value: 'any', label: copy.waitlist.anyone },
                  ...employees.map((employee) => ({ value: employee.id, label: employee.name })),
                ]}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label={copy.waitlist.from}
                  type="date"
                  value={fields.fromDate}
                  onChange={(event) => setField('fromDate', event.target.value)}
                />
                <FormField
                  label={copy.waitlist.to}
                  type="date"
                  value={fields.toDate}
                  error={errors.toDate}
                  onChange={(event) => setField('toDate', event.target.value)}
                />
              </div>
            </form>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
