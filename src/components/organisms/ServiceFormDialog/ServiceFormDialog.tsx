import { type FormEvent, useEffect, useState } from 'react';
import { Button, Dialog, Label, Switch } from '@/components/atoms';
import { FormField, SelectField, TextareaField } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { ServiceItem } from '@/lib/api';
import { amountToCents, centsToAmount } from '@/lib/utils';
import { useCategoryStore, useServiceStore } from '@/stores';

/** The "no category" option. A Radix Select cannot hold an empty string as a value. */
const UNCATEGORISED = 'none';

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
  category: string;
  /** Minutes of work before the gap, the gap, and the work after it. Empty means solid. */
  workBefore: string;
  pause: string;
  workAfter: string;
}

const EMPTY: Fields = {
  name: '',
  description: '',
  durationMinutes: '30',
  amount: '',
  active: true,
  category: UNCATEGORISED,
  workBefore: '',
  pause: '',
  workAfter: '',
};

function toFields(service?: ServiceItem): Fields {
  if (!service) return EMPTY;
  return {
    name: service.name,
    description: service.description ?? '',
    durationMinutes: String(service.durationMinutes),
    amount: centsToAmount(service.priceCents),
    active: service.active,
    category: service.categoryId ?? UNCATEGORISED,
    // The form offers work / pause / work, which is the shape a salon actually has.
    // A service with more parts than that keeps them until somebody edits them here.
    workBefore: service.segments?.length ? String(service.segments[0].minutes) : '',
    pause: service.segments?.length ? String(pauseMinutes(service.segments)) : '',
    workAfter: service.segments?.length
      ? String(service.segments[service.segments.length - 1].minutes)
      : '',
  };
}

/** Everything between the first and last stretch, however many parts it came in. */
function pauseMinutes(segments: { minutes: number; busy: boolean }[]): number {
  return segments.slice(1, -1).reduce((total, segment) => total + segment.minutes, 0);
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const copy = useCopy();
  const create = useServiceStore((state) => state.create);
  const update = useServiceStore((state) => state.update);
  const status = useServiceStore((state) => state.status);
  const error = useServiceStore((state) => state.error);
  // No picker at all until the business has made a heading — a shop with four services
  // should never be asked to file them.
  const categories = useCategoryStore((state) => state.items);

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

    /**
     * Work, gap, work — or nothing at all.
     *
     * All three or none: two of them describe an appointment whose parts do not add up,
     * and the server would refuse it with a message about segments that means nothing to
     * somebody looking at three boxes.
     */
    const parts = [fields.workBefore, fields.pause, fields.workAfter].map((value) =>
      Number(value.trim()),
    );
    const hasPause = [fields.workBefore, fields.pause, fields.workAfter].some(
      (value) => value.trim() !== '',
    );
    const partsValid = parts.every((value) => Number.isInteger(value) && value >= 1);

    if (fields.name.trim().length < 2) nextErrors.name = copy.services.errorName;
    if (hasPause && !partsValid) {
      nextErrors.pause = copy.services.errorPauseParts;
    }
    // Only when the length is the thing being given. With a pause it comes from the parts.
    if (!hasPause && (!Number.isInteger(duration) || duration < 5 || duration > 480)) {
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
      // null, not undefined, for the same reason as the category below: undefined would
      // leave an old shape in place and make "clear the pause" do nothing.
      segments: hasPause
        ? [
            { minutes: parts[0], busy: true },
            { minutes: parts[1], busy: false },
            { minutes: parts[2], busy: true },
          ]
        : null,
      // null, not undefined: undefined leaves the category alone, which would make
      // "Sem categoria" the one choice in this form that does nothing.
      category: fields.category === UNCATEGORISED ? null : fields.category,
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

        {/*
          Three boxes rather than a general editor: work, gap, work is the shape a salon
          has, and a service with more parts than that is not worth a UI nobody will use.
          Left empty, the service is one solid block and the duration above is its length.
        */}
        <fieldset className="rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
          <legend className="px-1 font-medium text-brand-900 text-sm">
            {copy.services.pauseTitle}
          </legend>
          <p className="mb-3 text-xs text-ink-muted">{copy.services.pauseHint}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              label={copy.services.workBefore}
              inputMode="numeric"
              value={fields.workBefore}
              onChange={(event) => setField('workBefore', event.target.value)}
            />
            <FormField
              label={copy.services.pauseLength}
              inputMode="numeric"
              error={errors.pause}
              value={fields.pause}
              onChange={(event) => setField('pause', event.target.value)}
            />
            <FormField
              label={copy.services.workAfter}
              inputMode="numeric"
              value={fields.workAfter}
              onChange={(event) => setField('workAfter', event.target.value)}
            />
          </div>
        </fieldset>

        {categories.length > 0 ? (
          <SelectField
            label={copy.services.category}
            hint={copy.services.categoryHint}
            value={fields.category}
            onValueChange={(value) => setField('category', value)}
            options={[
              { value: UNCATEGORISED, label: copy.services.noCategory },
              ...categories.map((category) => ({ value: category.id, label: category.name })),
            ]}
          />
        ) : null}

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
