import { type FormEvent, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCopy } from '@/lib';
import { ApiError, authApi } from '@/lib/api';
import { PASSWORD_MIN } from '@/lib/utils';
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
  const copy = useCopy();
  const user = useAuthStore((state) => state.user);

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
      setEmailOutcome({ tone: 'bad', text: messageFor(error, copy.settings.didNotWork) });
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
        text: copy.settings.passwordChanged,
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordOutcome({ tone: 'bad', text: messageFor(error, copy.settings.didNotWork) });
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.settings.signingIn}</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">{copy.settings.signInAs(user?.email ?? '')}</p>
      </CardHeader>

      <CardBody className="grid gap-8 md:grid-cols-2">
        <form className="flex flex-col gap-4" onSubmit={submitEmail} noValidate>
          <div>
            <h3 className="text-sm font-medium text-brand-900">{copy.settings.changeEmail}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">{copy.settings.changeEmailLede}</p>
          </div>

          <FormField
            label={copy.settings.newEmail}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FormField
            label={copy.settings.yourPassword}
            type="password"
            required
            autoComplete="current-password"
            hint={copy.settings.whyPassword}
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
            {copy.settings.sendLink}
          </Button>
        </form>

        <form className="flex flex-col gap-4" onSubmit={submitPassword} noValidate>
          <div>
            <h3 className="text-sm font-medium text-brand-900">{copy.settings.changePassword}</h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              {copy.settings.passwordRules(PASSWORD_MIN)}
            </p>
          </div>

          <FormField
            label={copy.settings.currentPassword}
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <FormField
            label={copy.settings.newPassword}
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
            {copy.settings.changePassword}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
