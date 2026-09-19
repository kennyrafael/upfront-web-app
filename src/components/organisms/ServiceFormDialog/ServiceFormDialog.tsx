import { type FormEvent, useEffect, useState } from 'react';
import { Button, Dialog, Label, Switch } from '@/components/atoms';
import { FormField, TextareaField } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { ServiceItem } from '@/lib/api';
import { amountToCents, centsToAmount } from '@/lib/utils';
import { useServiceStore } from '@/stores';

export interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent when creating. */
  service?: ServiceItem;
}

interface Fields {
  name: string;
  description: string;
  durationMinutes: string;
  amount: string;
  active: boolean;
}

const EMPTY: Fields = {
  name: '',
  description: '',
  durationMinutes: '30',
  amount: '',
  active: true,
};

function toFields(service?: ServiceItem): Fields {
  if (!service) return EMPTY;
  return {
    name: service.name,
    description: service.description ?? '',
    durationMinutes: String(service.durationMinutes),
    amount: centsToAmount(service.priceCents),
    active: service.active,
  };
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const copy = useCopy();
  const create = useServiceStore((state) => state.create);
  const update = useServiceStore((state) => state.update);
  const status = useServiceStore((state) => state.status);
  const error = useServiceStore((state) => state.error);

  const [fields, setFields] = useState<Fields>(() => toFields(service));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});

  // Reseeds each time the dialog opens, so an edit never shows the previous service.
  useEffect(() => {
    if (open) {
      setFields(toFields(service));
      setErrors({});
    }
  }, [open, service]);

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const duration = Number(fields.durationMinutes);
    const priceCents = amountToCents(fields.amount);
    const nextErrors: Partial<Record<keyof Fields, string>> = {};

    if (fields.name.trim().length < 2) nextErrors.name = copy.services.errorName;
    if (!Number.isInteger(duration) || duration < 5 || duration > 480) {
      nextErrors.durationMinutes = copy.services.errorDuration;
    }
    if (priceCents === null) nextErrors.amount = copy.services.errorPrice;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || priceCents === null) return;

    const payload = {
      name: fields.name.trim(),
      description: fields.description.trim() || undefined,
      durationMinutes: duration,
      priceCents,
      active: fields.active,
    };

    const ok = service ? await update(service.id, payload) : await create(payload);
    if (ok) onOpenChange(false);
  }

  const busy = status === 'saving';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={service ? copy.services.editTitle : copy.services.newTitle}
      description={copy.services.formLede}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            {copy.common.cancel}
          </Button>
          <Button type="submit" form="service-form" loading={busy}>
            {service ? copy.services.saveButton : copy.services.addButton}
          </Button>
        </>
      }
    >
      <form id="service-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormField
          label={copy.common.name}
          required
          autoFocus
          error={errors.name}
          value={fields.name}
          onChange={(event) => setField('name', event.target.value)}
        />
        <TextareaField
          label={copy.services.description}
          hint={copy.services.descriptionHint}
          value={fields.description}
          onChange={(event) => setField('description', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={copy.common.duration}
            required
            inputMode="numeric"
            hint={copy.services.durationHint}
            error={errors.durationMinutes}
            value={fields.durationMinutes}
            onChange={(event) => setField('durationMinutes', event.target.value)}
          />
          <FormField
            label={copy.common.price}
            required
            inputMode="decimal"
            hint={copy.services.priceHint}
            error={errors.amount}
            value={fields.amount}
            onChange={(event) => setField('amount', event.target.value)}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
          <div>
            <Label htmlFor="service-active">{copy.services.bookable}</Label>
            <p className="text-xs text-ink-muted">{copy.services.archivedHint}</p>
          </div>
          <Switch
            id="service-active"
            checked={fields.active}
            onCheckedChange={(checked) => setField('active', checked)}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
