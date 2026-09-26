import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { SelectField } from '@/components/molecules';
import { WorkingHoursEditor } from '@/components/organisms/WorkingHoursEditor';
import { useCopy } from '@/lib';
import { SLOT_MINUTES_CHOICES, type WorkingHours } from '@/lib/api';
import { useBusinessStore } from '@/stores';

/**
 * When the shop is open, and how finely the day is divided.
 *
 * **Only that.** Who the business is — its name, number, NIF and address — moved to the
 * payments tab, where the same fields are what the gateway checks before a euro can be
 * collected. Asking for them twice in two places, for two reasons, is how a provider ends
 * up with a trading name here that disagrees with the one on their recibos.
 */
export function BusinessProfileForm() {
  const copy = useCopy();
  const profile = useBusinessStore((state) => state.profile);
  const status = useBusinessStore((state) => state.status);
  const error = useBusinessStore((state) => state.error);
  const update = useBusinessStore((state) => state.update);

  const [hours, setHours] = useState<WorkingHours[]>(profile?.hours ?? []);
  const [slotMinutes, setSlotMinutes] = useState<number>(profile?.slotMinutes ?? 30);
  const [saved, setSaved] = useState(false);

  // The profile arrives after the first render, so the form seeds itself when it lands.
  useEffect(() => {
    setHours(profile?.hours ?? []);
    setSlotMinutes(profile?.slotMinutes ?? 30);
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(await update({ hours, slotMinutes }));
  }

  const busy = status === 'saving';

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <Card id="profile">
        <CardHeader>
          <CardTitle>{copy.settings.shopHours}</CardTitle>
          <p className="mt-1 text-ink-muted text-sm">
            {copy.settings.shopHoursLede(profile?.timezone ?? 'Europe/Lisbon')}
          </p>
        </CardHeader>
        <CardBody>
          <WorkingHoursEditor
            value={hours}
            disabled={busy}
            onChange={(next) => {
              setHours(next);
              setSaved(false);
            }}
          />

          {/*
            Beside the hours rather than with the booking page, because it is both: the
            rows of the calendar and the starts offered to clients are the same grid.
          */}
          <div className="mt-6 max-w-xs border-hairline border-t pt-5">
            <SelectField
              label={copy.settings.slotMinutes}
              hint={copy.settings.slotMinutesHint}
              disabled={busy}
              value={String(slotMinutes)}
              onValueChange={(value) => {
                setSlotMinutes(Number(value));
                setSaved(false);
              }}
              options={SLOT_MINUTES_CHOICES.map((minutes) => ({
                value: String(minutes),
                label: copy.settings.everyMinutes(minutes),
              }))}
            />
          </div>

          <p className="mt-6 border-hairline border-t pt-5 text-ink-muted text-sm">
            {copy.settings.businessDetailsMoved}
          </p>
        </CardBody>
      </Card>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-danger-ink text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {copy.settings.saveChanges}
        </Button>
        {saved ? <span className="text-brand-ink text-sm">{copy.settings.saved}</span> : null}
      </div>
    </form>
  );
}
