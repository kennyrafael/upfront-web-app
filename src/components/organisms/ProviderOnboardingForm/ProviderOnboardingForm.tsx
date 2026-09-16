import { useState } from 'react';
import { Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { WorkingHoursEditor } from '@/components/organisms/WorkingHoursEditor';
import type { WorkingHours } from '@/lib/api';
import { amountToCents, cn } from '@/lib/utils';
import { useProviderStore, useServiceStore } from '@/stores';

export interface ProviderOnboardingFormProps {
  onDone: () => void;
}

const STEPS = ['Business', 'Hours', 'First service'] as const;

const DEFAULT_HOURS: WorkingHours[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  start: '09:00',
  end: '18:00',
}));

export function ProviderOnboardingForm({ onDone }: ProviderOnboardingFormProps) {
  const profile = useProviderStore((state) => state.profile);
  const updateProfile = useProviderStore((state) => state.update);
  const completeOnboarding = useProviderStore((state) => state.completeOnboarding);
  const providerStatus = useProviderStore((state) => state.status);
  const providerError = useProviderStore((state) => state.error);

  const createService = useServiceStore((state) => state.create);
  const serviceError = useServiceStore((state) => state.error);

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(profile?.businessName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [nif, setNif] = useState(profile?.nif ?? '');
  const [nifError, setNifError] = useState<string>();
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(
    profile?.workingHours?.length ? profile.workingHours : DEFAULT_HOURS,
  );
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState('30');
  const [amount, setAmount] = useState('');
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});

  const busy = providerStatus === 'saving';
  const error = providerError ?? serviceError;

  async function saveBusiness() {
    if (nif && !/^\d{9}$/.test(nif)) {
      setNifError('A Portuguese NIF is exactly 9 digits');
      return;
    }
    setNifError(undefined);
    const ok = await updateProfile({
      businessName: businessName || undefined,
      phone: phone || undefined,
      nif: nif || undefined,
    });
    if (ok) setStep(1);
  }

  async function saveHours() {
    if (await updateProfile({ workingHours })) {
      setStep(2);
    }
  }

  /** The first service is optional — skipping still completes onboarding. */
  async function finish(withService: boolean) {
    if (withService) {
      const minutes = Number(duration);
      const priceCents = amountToCents(amount);
      const errors: Record<string, string> = {};
      if (serviceName.trim().length < 2) errors.name = 'Give the service a name';
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
        errors.duration = 'Between 5 and 480 minutes';
      }
      if (priceCents === null) errors.amount = 'Use a number like 18 or 18.50';

      setServiceErrors(errors);
      if (Object.keys(errors).length > 0 || priceCents === null) return;

      const created = await createService({
        name: serviceName.trim(),
        durationMinutes: minutes,
        priceCents,
      });
      if (!created) return;
    }

    if (await completeOnboarding()) {
      onDone();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex items-center gap-2 text-xs">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full font-medium transition-colors',
                index <= step
                  ? 'bg-brand-700 text-white'
                  : 'bg-brand-900/8 text-ink-muted ring-1 ring-hairline',
              )}
            >
              {index + 1}
            </span>
            <span className={cn(index === step ? 'font-medium text-brand-900' : 'text-ink-muted')}>
              {label}
            </span>
            {index < STEPS.length - 1 ? (
              <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <FormField
            label="Business name"
            hint="How clients know you. Leave blank to trade under your own name."
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
          <FormField
            label="Phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <FormField
            label="NIF"
            inputMode="numeric"
            hint="9 digits. Needed before you issue a recibo verde — you can add it later."
            error={nifError}
            value={nif}
            onChange={(event) => setNif(event.target.value)}
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            We have pre-filled a Monday-to-Friday week. Adjust it, or split a day into two rows for
            a lunch break.
          </p>
          <WorkingHoursEditor value={workingHours} onChange={setWorkingHours} disabled={busy} />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Add the thing you book most often. You can add the rest any time.
          </p>
          <FormField
            label="Service name"
            error={serviceErrors.name}
            value={serviceName}
            onChange={(event) => setServiceName(event.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Duration"
              inputMode="numeric"
              hint="Minutes."
              error={serviceErrors.duration}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
            <FormField
              label="Price"
              inputMode="decimal"
              hint="Euros, e.g. 18.50."
              error={serviceErrors.amount}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((current) => current - 1)}
          disabled={step === 0 || busy}
        >
          Back
        </Button>

        <div className="flex gap-2">
          {step === 2 ? (
            <Button variant="secondary" onClick={() => finish(false)} disabled={busy}>
              Skip for now
            </Button>
          ) : null}
          <Button
            loading={busy}
            onClick={() => {
              if (step === 0) return saveBusiness();
              if (step === 1) return saveHours();
              return finish(true);
            }}
          >
            {step === 2 ? 'Finish setup' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
