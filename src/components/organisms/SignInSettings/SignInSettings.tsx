import { type FormEvent, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { ApiError, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

type Outcome = { tone: 'ok' | 'bad'; text: string } | null;

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * The two things that decide who can get into this account.
 *
 * Together in one card because they answer the same question. Both ask for the current
 * password, which is the point: a session that has been taken over should not be enough to
 * take the account with it.
 */
export function SignInSettings() {
  const provider = useAuthStore((state) => state.provider);

  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailOutcome, setEmailOutcome] = useState<Outcome>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordOutcome, setPasswordOutcome] = useState<Outcome>(null);

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setEmailBusy(true);
    setEmailOutcome(null);
    try {
      await authApi.changeEmail(email.trim(), emailPassword);
      setEmailOutcome({
        tone: 'ok',
        // Says where to look, because nothing visible changes here and the obvious reading
        // of a silent success is that it did not work.
        text: `Check ${email.trim()} for a link. Your address changes only once you use it.`,
      });
      setEmail('');
      setEmailPassword('');
    } catch (error) {
      setEmailOutcome({ tone: 'bad', text: messageFor(error, 'That did not work.') });
    } finally {
      setEmailBusy(false);
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordOutcome(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordOutcome({
        tone: 'ok',
        text: 'Password changed. Everywhere else you were signed in has been signed out.',
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordOutcome({ tone: 'bad', text: messageFor(error, 'That did not work.') });
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signing in</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          You sign in as <span className="text-brand-900">{provider?.email}</span>.
        </p>
      </CardHeader>

      <CardBody className="grid gap-8 md:grid-cols-2">
        <form className="flex flex-col gap-4" onSubmit={submitEmail} noValidate>
          <div>
            <h3 className="text-sm font-medium text-brand-900">Change your email</h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              We send a link to the new address. Nothing changes until you open it.
            </p>
          </div>

          <FormField
            label="New email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FormField
            label="Your password"
            type="password"
            required
            autoComplete="current-password"
            hint="Asked for because changing this address changes how the account is recovered."
            value={emailPassword}
            onChange={(event) => setEmailPassword(event.target.value)}
          />

          {emailOutcome ? (
            <p
              role={emailOutcome.tone === 'bad' ? 'alert' : 'status'}
              className={
                emailOutcome.tone === 'bad'
                  ? 'rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink'
                  : 'rounded-lg bg-brand-700/8 px-3 py-2 text-sm text-brand-900'
              }
            >
              {emailOutcome.text}
            </p>
          ) : null}

          <Button
            type="submit"
            className="self-start"
            loading={emailBusy}
            disabled={!email.trim() || !emailPassword}
          >
            Send the link
          </Button>
        </form>

        <form className="flex flex-col gap-4" onSubmit={submitPassword} noValidate>
          <div>
            <h3 className="text-sm font-medium text-brand-900">Change your password</h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              At least 10 characters. Other devices are signed out.
            </p>
          </div>

          <FormField
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <FormField
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />

          {passwordOutcome ? (
            <p
              role={passwordOutcome.tone === 'bad' ? 'alert' : 'status'}
              className={
                passwordOutcome.tone === 'bad'
                  ? 'rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink'
                  : 'rounded-lg bg-brand-700/8 px-3 py-2 text-sm text-brand-900'
              }
            >
              {passwordOutcome.text}
            </p>
          ) : null}

          <Button
            type="submit"
            className="self-start"
            loading={passwordBusy}
            disabled={!currentPassword || newPassword.length < 10}
          >
            Change password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
