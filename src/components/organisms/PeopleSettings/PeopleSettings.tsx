import { type FormEvent, useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Switch } from '@/components/atoms';
import { ConfirmDialog, FormField } from '@/components/molecules';
import { WorkingHoursEditor } from '@/components/organisms/WorkingHoursEditor';
import { useCopy } from '@/lib';
import type { Employee, WorkingHours } from '@/lib/api';
import { useAuthStore, useBusinessStore, useEmployeeStore } from '@/stores';
import { SkillsPanel } from './SkillsPanel';
import { TimeOffPanel } from './TimeOffPanel';

/**
 * Who works here.
 *
 * Hours are edited per person and are a *narrowing* of the shop's, never a widening — the
 * copy says so, because somebody setting 07:00 on a shop that opens at 09:00 will otherwise
 * wonder why no slots appear.
 */
export function PeopleSettings() {
  const copy = useCopy();
  const items = useEmployeeStore((state) => state.items);
  const includeInactive = useEmployeeStore((state) => state.includeInactive);
  const setIncludeInactive = useEmployeeStore((state) => state.setIncludeInactive);
  const status = useEmployeeStore((state) => state.status);
  const error = useEmployeeStore((state) => state.error);
  const load = useEmployeeStore((state) => state.load);
  const create = useEmployeeStore((state) => state.create);
  const update = useEmployeeStore((state) => state.update);
  const deactivate = useEmployeeStore((state) => state.deactivate);

  const myEmployeeId = useAuthStore((state) => state.user?.employeeId);
  const timezone = useBusinessStore((state) => state.profile?.timezone) ?? 'Europe/Lisbon';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [leaving, setLeaving] = useState<Employee | null>(null);
  const [away, setAway] = useState<Employee | null>(null);
  const [skilling, setSkilling] = useState<Employee | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    if (await create({ name: name.trim(), phone: phone.trim() || undefined })) {
      setName('');
      setPhone('');
      setAdding(false);
    }
  }

  function startEditing(employee: Employee) {
    setEditing(employee);
    setHours(employee.hours);
  }

  async function saveHours() {
    if (!editing) return;
    if (await update(editing.id, { hours })) setEditing(null);
  }

  const busy = status === 'saving';

  return (
    <Card id="people">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{copy.people.title}</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">{copy.people.lede}</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setAdding(!adding)}>
            {adding ? copy.common.cancel : copy.people.addSomeone}
          </Button>
        </div>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        {adding ? (
          <form
            className="grid gap-3 rounded-xl bg-sheet/50 p-3 ring-1 ring-hairline sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={handleAdd}
          >
            <FormField
              label={copy.common.name}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <FormField
              label={copy.common.phone}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
            <Button type="submit" loading={busy}>
              {copy.people.add}
            </Button>
          </form>
        ) : null}

        <ul className="flex flex-col gap-2">
          {items.map((employee) => (
            <li
              key={employee.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sheet/50 p-3 ring-1 ring-hairline"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-ink">
                  <span className="truncate">{employee.name}</span>
                  {employee.id === myEmployeeId ? (
                    <Badge variant="neutral">{copy.people.you}</Badge>
                  ) : null}
                  {employee.active ? null : <Badge variant="warning">{copy.people.left}</Badge>}
                </p>
                <p className="text-sm text-ink-muted">
                  {employee.hours.length
                    ? copy.people.timesAWeek(employee.hours.length)
                    : copy.people.followsShop}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(employee)}
                >
                  {copy.people.hours}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAway(away?.id === employee.id ? null : employee)}
                >
                  {copy.people.away}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSkilling(skilling?.id === employee.id ? null : employee)}
                >
                  {copy.people.does}
                </Button>
                {employee.active ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeaving(employee)}
                  >
                    {copy.people.theyLeft}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void update(employee.id, { active: true })}
                  >
                    {copy.people.bringBack}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {skilling ? <SkillsPanel employee={skilling} onClose={() => setSkilling(null)} /> : null}

        {away ? (
          <TimeOffPanel employee={away} timezone={timezone} onClose={() => setAway(null)} />
        ) : null}

        {editing ? (
          <div className="flex flex-col gap-3 rounded-xl bg-sheet/50 p-3 ring-1 ring-hairline">
            <p className="text-sm text-ink-muted">{copy.people.hoursFor(editing.name)}</p>
            <WorkingHoursEditor value={hours} disabled={busy} onChange={setHours} />
            <div className="flex items-center gap-3">
              <Button type="button" loading={busy} onClick={() => void saveHours()}>
                {copy.people.saveHours}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                {copy.common.cancel}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Switch
            id="show-past-people"
            checked={includeInactive}
            onCheckedChange={(next) => void setIncludeInactive(next)}
          />
          <label htmlFor="show-past-people" className="text-sm text-ink-muted">
            {copy.people.showLeft}
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}
      </CardBody>

      <ConfirmDialog
        open={Boolean(leaving)}
        onOpenChange={(open) => !open && setLeaving(null)}
        title={copy.people.removeTitle(leaving?.name ?? '')}
        // Said plainly, because "delete" is what this button looks like and is not what it does.
        description={copy.people.removeBody}
        confirmLabel={copy.people.theyLeft}
        onConfirm={async () => {
          if (leaving) await deactivate(leaving.id);
          setLeaving(null);
        }}
      />
    </Card>
  );
}
