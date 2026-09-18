import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { WorkingHoursEditor } from '@/components/organisms/WorkingHoursEditor';
import type { BusinessProfile, WorkingHours } from '@/lib/api';
import { useBusinessStore } from '@/stores';

interface ProfileFields {
  name: string;
  phone: string;
  nif: string;
}

function toFields(profile: BusinessProfile | null): ProfileFields {
  return {
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    nif: profile?.nif ?? '',
  };
}

export function BusinessProfileForm() {
  const profile = useBusinessStore((state) => state.profile);
  const status = useBusinessStore((state) => state.status);
  const error = useBusinessStore((state) => state.error);
  const update = useBusinessStore((state) => state.update);

  const [fields, setFields] = useState<ProfileFields>(() => toFields(profile));
  const [hours, setHours] = useState<WorkingHours[]>(profile?.hours ?? []);
  const [nifError, setNifError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // The profile arrives after the first render, so the form seeds itself when it lands.
  useEffect(() => {
    setFields(toFields(profile));
    setHours(profile?.hours ?? []);
  }, [profile]);

  function setField(key: keyof ProfileFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (fields.nif && !/^\d{9}$/.test(fields.nif)) {
      setNifError('A Portuguese NIF is exactly 9 digits');
      return;
    }
    setNifError(undefined);

    const ok = await update({
      name: fields.name,
      phone: fields.phone || undefined,
      nif: fields.nif || undefined,
      hours,
    });
    setSaved(ok);
  }

  const busy = status === 'saving';

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <Card id="profile">
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            The NIF is what recibos verdes are issued against.
          </p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Business name"
            required
            hint="What clients see on your booking page."
            value={fields.name}
            onChange={(event) => setField('name', event.target.value)}
          />
          <FormField
            label="Phone"
            type="tel"
            value={fields.phone}
            onChange={(event) => setField('phone', event.target.value)}
          />
          <FormField
            label="NIF"
            inputMode="numeric"
            error={nifError}
            hint="9 digits."
            value={fields.nif}
            onChange={(event) => setField('nif', event.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shop hours</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            When the door is open, local to {profile?.timezone ?? 'Europe/Lisbon'}. A ceiling rather
            than an offer — what each person is bookable for is this crossed with their own hours.
            Split a day into two rows to carve out a lunch break.
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
        </CardBody>
      </Card>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          Save changes
        </Button>
        {saved ? <span className="text-sm text-brand-ink">Saved.</span> : null}
      </div>
    </form>
  );
}
