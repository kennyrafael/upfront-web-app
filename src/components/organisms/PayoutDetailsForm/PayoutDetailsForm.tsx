import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField, SelectField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { BUSINESS_CATEGORIES, type BusinessProfile, ENTITY_TYPES } from '@/lib/api';
import { useBusinessStore } from '@/stores';

interface Fields {
  entityType: string;
  businessCategory: string;
  nif: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  payoutIban: string;
  websiteUrl: string;
}

function toFields(profile: BusinessProfile | null): Fields {
  return {
    entityType: profile?.entityType ?? 'individual',
    businessCategory: profile?.businessCategory ?? '',
    nif: profile?.nif ?? '',
    firstName: profile?.representative?.firstName ?? '',
    lastName: profile?.representative?.lastName ?? '',
    birthDate: profile?.representative?.birthDate ?? '',
    payoutIban: profile?.payoutIban ?? '',
    websiteUrl: profile?.websiteUrl ?? '',
  };
}

/**
 * Everything the payment gateway needs, asked for in one place and in its own words.
 *
 * **It exists to make the purpose legible.** These fields were scattered through the
 * business profile, where a provider filling them in had no reason to know why a date of
 * birth was wanted — and then met an onboarding form that asked for it all over again. Here
 * the heading says what it is for, and answering it once means the gateway asks for almost
 * nothing.
 *
 * Ordered the way the gateway's own form asks: who the business is, who answers for it,
 * where the money lands, what to show a client. The NIF appears here *and* in the business
 * profile on purpose — it is wanted by a recibo verde as well, and a provider who has
 * already given it sees it filled in rather than asked twice.
 */
export function PayoutDetailsForm() {
  const copy = useCopy();
  const profile = useBusinessStore((state) => state.profile);
  const status = useBusinessStore((state) => state.status);
  const update = useBusinessStore((state) => state.update);

  const [fields, setFields] = useState<Fields>(() => toFields(profile));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFields(toFields(profile));
  }, [profile]);

  function setField(key: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found: Partial<Record<keyof Fields, string>> = {};
    if (fields.nif && !/^\d{9}$/.test(fields.nif)) found.nif = copy.settings.nifError;
    if (fields.payoutIban && !/^PT50[\s\d]{21,25}$/.test(fields.payoutIban)) {
      found.payoutIban = copy.payoutDetails.ibanError;
    }
    // Rejected rather than nudged into shape: a date of birth typed wrong is a failed
    // identity check days later, not an error anybody connects back to this field.
    if (fields.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(fields.birthDate)) {
      found.birthDate = copy.payoutDetails.birthDateError;
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Whole or not at all, the way the API takes it: a first name with no date of birth
    // verifies nobody.
    const complete = fields.firstName && fields.lastName && fields.birthDate;

    const ok = await update({
      entityType: fields.entityType as BusinessProfile['entityType'],
      businessCategory: (fields.businessCategory ||
        undefined) as BusinessProfile['businessCategory'],
      nif: fields.nif || undefined,
      representative: complete
        ? {
            firstName: fields.firstName,
            lastName: fields.lastName,
            birthDate: fields.birthDate,
          }
        : undefined,
      payoutIban: fields.payoutIban || undefined,
      websiteUrl: fields.websiteUrl || undefined,
    });
    setSaved(ok);
  }

  const busy = status === 'saving';
  // Shown as the placeholder rather than filled in, so leaving it empty is visibly the
  // normal thing to do and does not read as an unanswered question.
  const bookingPage = profile?.slug ? `${window.location.origin}/book/${profile.slug}` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{copy.payoutDetails.title}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{copy.payoutDetails.lede}</p>
        </CardHeader>

        <CardBody className="flex flex-col gap-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <p className="sm:col-span-2 font-medium text-ink text-sm">
              {copy.payoutDetails.businessSection}
            </p>
            <SelectField
              label={copy.settings.entityType}
              hint={copy.settings.entityTypeHint}
              disabled={busy}
              value={fields.entityType}
              onValueChange={(value) => setField('entityType', value)}
              options={ENTITY_TYPES.map((type) => ({
                value: type,
                label: copy.settings.entityTypes[type],
              }))}
            />
            <SelectField
              label={copy.settings.businessCategory}
              hint={copy.settings.businessCategoryHint}
              disabled={busy}
              value={fields.businessCategory}
              onValueChange={(value) => setField('businessCategory', value)}
              options={BUSINESS_CATEGORIES.map((category) => ({
                value: category,
                label: copy.settings.businessCategories[category],
              }))}
            />
            <FormField
              label={copy.settings.nif}
              inputMode="numeric"
              error={errors.nif}
              hint={copy.payoutDetails.nifHint}
              value={fields.nif}
              onChange={(event) => setField('nif', event.target.value)}
            />
          </section>

          <section className="grid gap-4 border-hairline border-t pt-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="font-medium text-ink text-sm">{copy.payoutDetails.personSection}</p>
              <p className="mt-1 text-ink-muted text-sm">{copy.payoutDetails.personLede}</p>
            </div>
            <FormField
              label={copy.payoutDetails.firstName}
              hint={copy.payoutDetails.legalNameHint}
              value={fields.firstName}
              onChange={(event) => setField('firstName', event.target.value)}
            />
            <FormField
              label={copy.payoutDetails.lastName}
              value={fields.lastName}
              onChange={(event) => setField('lastName', event.target.value)}
            />
            <FormField
              label={copy.payoutDetails.birthDate}
              type="date"
              error={errors.birthDate}
              value={fields.birthDate}
              onChange={(event) => setField('birthDate', event.target.value)}
            />
          </section>

          <section className="grid gap-4 border-hairline border-t pt-6">
            <div>
              <p className="font-medium text-ink text-sm">{copy.payoutDetails.moneySection}</p>
              <p className="mt-1 text-ink-muted text-sm">{copy.payoutDetails.moneyLede}</p>
            </div>
            <FormField
              label={copy.payoutDetails.iban}
              error={errors.payoutIban}
              hint={copy.payoutDetails.ibanHint}
              placeholder="PT50 0002 0123 1234 5678 9015 4"
              value={fields.payoutIban}
              onChange={(event) => setField('payoutIban', event.target.value)}
            />
            <FormField
              label={copy.payoutDetails.website}
              hint={
                bookingPage
                  ? copy.payoutDetails.websiteHintWithPage(bookingPage)
                  : copy.payoutDetails.websiteHint
              }
              placeholder={bookingPage}
              value={fields.websiteUrl}
              onChange={(event) => setField('websiteUrl', event.target.value)}
            />
          </section>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={busy}>
              {copy.settings.saveChanges}
            </Button>
            {saved ? <span className="text-brand-ink text-sm">{copy.settings.saved}</span> : null}
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
