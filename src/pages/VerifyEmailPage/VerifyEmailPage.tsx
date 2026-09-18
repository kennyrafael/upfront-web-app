import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout, Button, Spinner } from '@/components';
import { ApiError, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const markVerified = useAuthStore((state) => state.markVerified);
  const signedIn = useAuthStore((state) => Boolean(state.accessToken));

  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');
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
        const user = await authApi.verifyEmail(token);
        // Updates the banner immediately rather than waiting for the next page load.
        if (signedIn) markVerified(user);
        setState('done');
      } catch (error) {
        setState('failed');
        setMessage(
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
        );
      }
    })();
  }, [token, markVerified, signedIn]);

  if (state === 'working') {
    return (
      <AuthLayout title="Confirming your email">
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
          <Spinner className="size-4 text-brand-ink" /> One moment…
        </p>
      </AuthLayout>
    );
  }

  if (state === 'failed') {
    return (
      <AuthLayout title="That link did not work">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">{message}</p>
          <p className="text-sm text-ink-muted">
            Links expire after a day and work only once. Sign in and we will send another.
          </p>
          <Link to={signedIn ? '/settings' : '/login'}>
            <Button fullWidth>{signedIn ? 'Go to settings' : 'Sign in'}</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email confirmed">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">
          Thank you — you can now publish your booking page and take deposits.
        </p>
        <Link to={signedIn ? '/settings' : '/login'}>
          <Button fullWidth>{signedIn ? 'Publish your page' : 'Sign in'}</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
