import { useEffect, useState } from 'react';
import { Button, Checkbox, Input, Label, Switch } from '@/components/atoms';
import { useCopy } from '@/lib';
import type { Employee } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { useEmployeeStore, useServiceStore } from '@/stores';

interface SkillsPanelProps {
  employee: Employee;
  onClose: () => void;
}

interface Skill {
  serviceId: string;
  price: string;
  duration: string;
}

/** `2200` to `22.00`, so an override is typed in euros like every other price in the app. */
const toEuros = (cents?: number) => (cents === undefined ? '' : (cents / 100).toFixed(2));
const toCents = (euros: string) =>
  euros.trim() ? Math.round(Number(euros.replace(',', '.')) * 100) : undefined;

/**
 * What one person does, and what they charge for it.
 *
 * **"Everything" is a state, not an empty list.** An empty `services` means the whole
 * catalog, which is the right default and completely invisible if the UI just shows nothing
 * ticked — somebody would tick one box to "add" a service and silently narrow the person to
 * that one. So the switch says it out loud, and the list only appears once it is off.
 */
export function SkillsPanel({ employee, onClose }: SkillsPanelProps) {
  const copy = useCopy();
  const services = useServiceStore((state) => state.items);
  const loadServices = useServiceStore((state) => state.load);
  const update = useEmployeeStore((state) => state.update);
  const status = useEmployeeStore((state) => state.status);

  const [everything, setEverything] = useState(employee.services.length === 0);
  const [skills, setSkills] = useState<Skill[]>(() =>
    employee.services.map((skill) => ({
      serviceId: skill.serviceId,
      price: toEuros(skill.priceCents),
      duration: skill.durationMinutes ? String(skill.durationMinutes) : '',
    })),
  );

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  function toggle(serviceId: string, on: boolean) {
    setSkills((current) =>
      on
        ? [...current, { serviceId, price: '', duration: '' }]
        : current.filter((skill) => skill.serviceId !== serviceId),
    );
  }

  function setField(serviceId: string, key: 'price' | 'duration', value: string) {
    setSkills((current) =>
      current.map((skill) => (skill.serviceId === serviceId ? { ...skill, [key]: value } : skill)),
    );
  }

  async function save() {
    const payload = everything
      ? []
      : skills.map((skill) => ({
          serviceId: skill.serviceId,
          priceCents: toCents(skill.price),
          durationMinutes: skill.duration.trim() ? Number(skill.duration) : undefined,
        }));

    if (await update(employee.id, { services: payload })) onClose();
  }

  const busy = status === 'saving';

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-sheet/50 p-3 ring-1 ring-hairline">
      <p className="text-sm text-ink-muted">{copy.people.skillsFor(employee.name)}</p>

      <div className="flex items-center gap-2">
        <Switch
          id={`everything-${employee.id}`}
          checked={everything}
          onCheckedChange={setEverything}
        />
        <Label htmlFor={`everything-${employee.id}`}>{copy.people.everything}</Label>
      </div>

      {everything ? null : (
        <ul className="flex flex-col gap-2">
          {services.map((service) => {
            const skill = skills.find((entry) => entry.serviceId === service.id);

            return (
              <li key={service.id} className="rounded-lg bg-canvas/40 p-2 ring-1 ring-hairline">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`does-${employee.id}-${service.id}`}
                    checked={Boolean(skill)}
                    onCheckedChange={(next) => toggle(service.id, next === true)}
                  />
                  <Label htmlFor={`does-${employee.id}-${service.id}`}>
                    {service.name}
                    <span className="ml-2 font-normal text-ink-muted text-xs">
                      {formatMoney(service.priceCents)} · {service.durationMinutes} min
                    </span>
                  </Label>
                </div>

                {skill ? (
                  /* Placeholders show the catalog value, so an empty box plainly means
                     "the same as everyone else" rather than "zero". */
                  <div className="mt-2 grid gap-2 pl-6 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`price-${employee.id}-${service.id}`} className="text-xs">
                        {copy.common.price}
                      </Label>
                      <Input
                        id={`price-${employee.id}-${service.id}`}
                        inputMode="decimal"
                        placeholder={toEuros(service.priceCents)}
                        value={skill.price}
                        onChange={(event) => setField(service.id, 'price', event.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`mins-${employee.id}-${service.id}`} className="text-xs">
                        {copy.people.minutes}
                      </Label>
                      <Input
                        id={`mins-${employee.id}-${service.id}`}
                        inputMode="numeric"
                        placeholder={String(service.durationMinutes)}
                        value={skill.duration}
                        onChange={(event) => setField(service.id, 'duration', event.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" loading={busy} onClick={() => void save()}>
          {copy.common.save}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {copy.common.cancel}
        </Button>
      </div>
    </div>
  );
}
