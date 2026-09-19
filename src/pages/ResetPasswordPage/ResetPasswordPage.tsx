import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout, Button } from '@/components';
import { FormField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { ApiError, authApi } from '@/lib/api';

/** Mirrors the API's rule, so the round trip is not wasted telling you what it could here. */
const MIN_LENGTH = 10;

export function ResetPasswordPage() {
  const copy = useCopy();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmation) {
      setError(copy.auth.mismatch);
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await authApi.resetPassword(token, password);
      // Every session ended, including any this browser had, so sign-in is the only way on.
      navigate('/login', { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : copy.auth.somethingWrong);
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title={copy.auth.linkIncomplete}
        footer={
          <Link
            to="/forgot-password"
            className="font-medium text-white underline-offset-2 hover:underline"
          >
            {copy.auth.requestNew}
          </Link>
        }
      >
        <p className="text-sm text-ink-muted">{copy.auth.openExactly}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={copy.auth.chooseNew}
      subtitle={copy.auth.signedOutElsewhere}
      footer={
        <Link to="/login" className="font-medium text-white underline-offset-2 hover:underline">
          {copy.auth.backToSignIn}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label={copy.auth.newPassword}
          type="password"
          required
          autoFocus
          autoComplete="new-password"
          hint={`At least ${MIN_LENGTH} characters.`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FormField
          label={copy.auth.again}
          type="password"
          required
          autoComplete="new-password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
        />

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth loading={saving}>
          {copy.auth.setPassword}
        </Button>
      </form>
    </AuthLayout>
  );
}
