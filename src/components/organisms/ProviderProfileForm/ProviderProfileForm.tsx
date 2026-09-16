import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { WorkingHoursEditor } from '@/components/organisms/WorkingHoursEditor';
import type { ProviderProfile, WorkingHours } from '@/lib/api';
import { useProviderStore } from '@/stores';

interface ProfileFields {
  name: string;
  businessName: string;
  phone: string;
  nif: string;
}

function toFields(profile: ProviderProfile | null): ProfileFields {
  return {
    name: profile?.name ?? '',
    businessName: profile?.businessName ?? '',
    phone: profile?.phone ?? '',
    nif: profile?.nif ?? '',
  };
}

export function ProviderProfileForm() {
  const profile = useProviderStore((state) => state.profile);
  const status = useProviderStore((state) => state.status);
  const error = useProviderStore((state) => state.error);
  const update = useProviderStore((state) => state.update);

  const [fields, setFields] = useState<ProfileFields>(() => toFields(profile));
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(profile?.workingHours ?? []);
  const [nifError, setNifError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // The profile arrives after the first render, so the form seeds itself when it lands.
  useEffect(() => {
    setFields(toFields(profile));
    setWorkingHours(profile?.workingHours ?? []);
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
      businessName: fields.businessName || undefined,
      phone: fields.phone || undefined,
      nif: fields.nif || undefined,
      workingHours,
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
            label="Your name"
            required
            value={fields.name}
            onChange={(event) => setField('name', event.target.value)}
          />
          <FormField
            label="Business name"
            value={fields.businessName}
            onChange={(event) => setField('businessName', event.target.value)}
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
          <CardTitle>Working hours</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Times are local to {profile?.timezone ?? 'Europe/Lisbon'}. Split a day into two rows to
            carve out a lunch break.
          </p>
        </CardHeader>
        <CardBody>
          <WorkingHoursEditor
            value={workingHours}
            disabled={busy}
            onChange={(next) => {
              setWorkingHours(next);
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
        {saved ? <span className="text-sm text-brand-700">Saved.</span> : null}
      </div>
    </form>
  );
}
