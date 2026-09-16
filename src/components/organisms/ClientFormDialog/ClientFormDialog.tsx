import { type FormEvent, useEffect, useState } from 'react';
import { Button, Dialog } from '@/components/atoms';
import { FormField, TextareaField } from '@/components/molecules';
import type { ClientRecord } from '@/lib/api';
import { useClientStore } from '@/stores';

export interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent when creating. */
  client?: ClientRecord;
}

interface Fields {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY: Fields = { name: '', email: '', phone: '', notes: '' };

function toFields(client?: ClientRecord): Fields {
  if (!client) return EMPTY;
  return {
    name: client.name,
    email: client.email ?? '',
    phone: client.phone ?? '',
    notes: client.notes ?? '',
  };
}

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const create = useClientStore((state) => state.create);
  const update = useClientStore((state) => state.update);
  const status = useClientStore((state) => state.status);
  const error = useClientStore((state) => state.error);
  const clearError = useClientStore((state) => state.clearError);

  const [fields, setFields] = useState<Fields>(() => toFields(client));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});

  useEffect(() => {
    if (open) {
      setFields(toFields(client));
      setErrors({});
      clearError();
    }
  }, [open, client, clearError]);

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof Fields, string>> = {};
    if (fields.name.trim().length < 2) nextErrors.name = 'Give the client a name';
    if (fields.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)) {
      nextErrors.email = 'That does not look like an email address';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      name: fields.name.trim(),
      email: fields.email.trim() || undefined,
      phone: fields.phone.trim() || undefined,
      notes: fields.notes.trim() || undefined,
    };

    const ok = client ? await update(client.id, payload) : Boolean(await create(payload));
    if (ok) onOpenChange(false);
  }

  const busy = status === 'saving';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={client ? 'Edit client' : 'New client'}
      description="Only a name is required — the rest can follow."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="client-form" loading={busy}>
            {client ? 'Save client' : 'Add client'}
          </Button>
        </>
      }
    >
      <form id="client-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <FormField
          label="Name"
          required
          autoFocus
          error={errors.name}
          value={fields.name}
          onChange={(event) => setField('name', event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Phone"
            type="tel"
            value={fields.phone}
            onChange={(event) => setField('phone', event.target.value)}
          />
          <FormField
            label="Email"
            type="email"
            error={errors.email}
            value={fields.email}
            onChange={(event) => setField('email', event.target.value)}
          />
        </div>
        <TextareaField
          label="Notes"
          hint="Preferences, allergies, anything worth remembering."
          value={fields.notes}
          onChange={(event) => setField('notes', event.target.value)}
        />

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
