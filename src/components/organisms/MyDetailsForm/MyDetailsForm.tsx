import { type FormEvent, useEffect, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { useAuthStore } from '@/stores';

/**
 * Your own name and number.
 *
 * Its own card, and its own save, because it is a different record from the shop: they were
 * one row until a business could have more than one person in it. Putting them back in one
 * form would mean a manager pressing "save" on fields they are not allowed to change.
 *
 * Everyone can edit this whatever their role — it is theirs.
 */
export function MyDetailsForm() {
  const copy = useCopy();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const updateMe = useAuthStore((state) => state.updateMe);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(await updateMe({ name, phone: phone || undefined }));
  }

  const busy = status === 'loading';

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <Card id="me">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{copy.settings.youTitle}</CardTitle>
            {user ? <Badge>{copy.settings.roles[user.role]}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{copy.settings.youLede}</p>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={copy.common.yourName}
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
          />
          <FormField
            label={copy.settings.yourPhone}
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
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
          {copy.common.save}
        </Button>
        {saved ? <span className="text-sm text-brand-ink">{copy.settings.saved}</span> : null}
      </div>
    </form>
  );
}
