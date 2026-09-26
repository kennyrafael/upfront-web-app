import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField, SelectField } from '@/components/molecules';
import { WorkingHoursEditor } from '@/components/organisms/WorkingHoursEditor';
import { useCopy } from '@/lib';
import { type BusinessProfile, SLOT_MINUTES_CHOICES, type WorkingHours } from '@/lib/api';
import { useBusinessStore } from '@/stores';

interface ProfileFields {
  name: string;
  phone: string;
  nif: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
}

function toFields(profile: BusinessProfile | null): ProfileFields {
  return {
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    nif: profile?.nif ?? '',
    line1: profile?.address?.line1 ?? '',
    line2: profile?.address?.line2 ?? '',
    city: profile?.address?.city ?? '',
    postalCode: profile?.address?.postalCode ?? '',
  };
}

export function BusinessProfileForm() {
  const copy = useCopy();
  const profile = useBusinessStore((state) => state.profile);
  const status = useBusinessStore((state) => state.status);
  const error = useBusinessStore((state) => state.error);
  const update = useBusinessStore((state) => state.update);

  const [fields, setFields] = useState<ProfileFields>(() => toFields(profile));
  const [hours, setHours] = useState<WorkingHours[]>(profile?.hours ?? []);
  const [slotMinutes, setSlotMinutes] = useState<number>(profile?.slotMinutes ?? 30);
  const [nifError, setNifError] = useState<string>();
  const [postalError, setPostalError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // The profile arrives after the first render, so the form seeds itself when it lands.
  useEffect(() => {
    setFields(toFields(profile));
    setHours(profile?.hours ?? []);
    setSlotMinutes(profile?.slotMinutes ?? 30);
  }, [profile]);

  function setField(key: keyof ProfileFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (fields.nif && !/^\d{9}$/.test(fields.nif)) {
      setNifError(copy.settings.nifError);
      return;
    }
    setNifError(undefined);

    if (fields.postalCode && !/^\d{4}-\d{3}$/.test(fields.postalCode)) {
      setPostalError(copy.settings.postalCodeError);
      return;
    }
    setPostalError(undefined);

    const ok = await update({
      name: fields.name,
      phone: fields.phone || undefined,
      nif: fields.nif || undefined,
      // All or nothing: the API rejects a partial address, because a city with no street
      // satisfies neither the recibo nor the gateway that wanted it.
      address: fields.line1
        ? {
            line1: fields.line1,
            line2: fields.line2 || undefined,
            city: fields.city,
            postalCode: fields.postalCode,
          }
        : undefined,
      hours,
      slotMinutes,
    });
    setSaved(ok);
  }

  const busy = status === 'saving';

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <Card id="profile">
        <CardHeader>
          <CardTitle>{copy.settings.businessDetails}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{copy.settings.businessDetailsLede}</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={copy.settings.businessName}
            required
            hint={copy.settings.businessNameHint}
            value={fields.name}
            onChange={(event) => setField('name', event.target.value)}
          />
          <FormField
            label={copy.common.phone}
            type="tel"
            value={fields.phone}
            onChange={(event) => setField('phone', event.target.value)}
          />
          <FormField
            label={copy.settings.nif}
            inputMode="numeric"
            error={nifError}
            hint={copy.settings.nifHint}
            value={fields.nif}
            onChange={(event) => setField('nif', event.target.value)}
          />
          <p className="text-ink-muted text-sm sm:col-span-2">
            {copy.settings.paymentDetailsMoved}
          </p>
        </CardBody>
      </Card>

      {/*
        Its own card rather than three more inputs among the details, because it is asked for
        by two separate things — a recibo verde carries it, and the payment gateway will not
        enable an account without it. The lede says so, so it does not read as bureaucracy.
      */}
      <Card id="address">
        <CardHeader>
          <CardTitle>{copy.settings.address}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{copy.settings.addressLede}</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              label={copy.settings.addressLine1}
              value={fields.line1}
              onChange={(event) => setField('line1', event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <FormField
              label={copy.settings.addressLine2}
              value={fields.line2}
              onChange={(event) => setField('line2', event.target.value)}
            />
          </div>
          <FormField
            label={copy.settings.city}
            value={fields.city}
            onChange={(event) => setField('city', event.target.value)}
          />
          <FormField
            label={copy.settings.postalCode}
            error={postalError}
            hint={copy.settings.postalCodeHint}
            value={fields.postalCode}
            onChange={(event) => setField('postalCode', event.target.value)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.settings.shopHours}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
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
          <div className="mt-6 max-w-xs border-t border-hairline pt-5">
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
        </CardBody>
      </Card>

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          {copy.settings.saveChanges}
        </Button>
        {saved ? <span className="text-sm text-brand-ink">{copy.settings.saved}</span> : null}
      </div>
    </form>
  );
}
