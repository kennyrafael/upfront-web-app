import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout, Button } from '@/components';
import { FormField } from '@/components/molecules';
import { authApi } from '@/lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      await authApi.forgotPassword(email.trim());
    } catch {
      // Deliberately ignored. The API cannot say whether the address exists, so neither can
      // this screen — and a visible failure here would be a way to find out by elimination.
    } finally {
      setSending(false);
      setSent(true);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={sent ? undefined : 'We will email you a link to choose a new one.'}
      footer={
        <Link to="/login" className="font-medium text-white underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-3">
          <p className="rounded-lg bg-brand-700/8 px-3 py-3 text-sm text-brand-900">
            {/* Says the same thing whether or not the account exists. */}
            If <strong className="font-medium">{email.trim()}</strong> belongs to an Upfront
            account, a reset link is on its way. It works once, and expires in an hour.
          </p>
          <p className="text-sm text-ink-muted">
            Nothing arrived? Check spam, then{' '}
            <button
              type="button"
              className="font-medium text-brand-ink underline-offset-2 hover:underline"
              onClick={() => setSent(false)}
            >
              try another address
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" fullWidth loading={sending}>
            Send the link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
