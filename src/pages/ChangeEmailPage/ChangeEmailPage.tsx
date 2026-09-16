import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout, Button, Spinner } from '@/components';
import { ApiError, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

/**
 * Where the link in a "confirm your new address" email lands.
 *
 * Signs the provider out on success, because the server has just revoked every session —
 * the account's identity changed, and anyone still holding a session was holding one issued
 * to the old address.
 */
export function ChangeEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const signOut = useAuthStore((state) => state.logout);

  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');
  const [email, setEmail] = useState<string>();
  const [message, setMessage] = useState<string>();

  // Guards against React's development double-effect: the token is single use, so spending
  // it twice would report a genuine success as a failure.
  const attempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setState('failed');
      setMessage('That link is incomplete. Open it exactly as it was sent.');
      return;
    }
    if (attempted.current) return;
    attempted.current = true;

    void (async () => {
      try {
        const result = await authApi.confirmEmailChange(token);
        setEmail(result.email);
        setState('done');
        void signOut();
      } catch (error) {
        setState('failed');
        setMessage(
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        );
      }
    })();
  }, [token, signOut]);

  if (state === 'working') {
    return (
      <AuthLayout title="Confirming your new address">
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
          <Spinner className="size-4 text-brand-700" /> One moment…
        </p>
      </AuthLayout>
    );
  }

  if (state === 'failed') {
    return (
      <AuthLayout title="That link did not work" subtitle={message}>
        <Button asChild fullWidth>
          <Link to="/settings">Back to settings</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email address changed" subtitle={`Your account now signs in as ${email}.`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">
          {/* Said plainly, because being signed out unexpectedly reads as something going
              wrong rather than as the safeguard it is. */}
          Everywhere you were signed in has been signed out, including here — a change of address is
          exactly the moment to make sure nobody else is still logged in.
        </p>
        <Button asChild fullWidth>
          <Link to="/login">Sign in with your new address</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
