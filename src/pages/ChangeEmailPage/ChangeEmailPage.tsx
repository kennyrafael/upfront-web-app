import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout, Button, Spinner } from '@/components';
import { useCopy } from '@/lib';
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
  const copy = useCopy();
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
        // The server's own words when it has some; ours are chosen at render, in whatever
        // language is showing then.
        setMessage(error instanceof ApiError ? error.message : undefined);
      }
    })();
  }, [token, signOut]);

  if (state === 'working') {
    return (
      <AuthLayout title={copy.auth.confirmingNewEmail}>
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
          <Spinner className="size-4 text-brand-ink" /> {copy.auth.oneMoment}
        </p>
      </AuthLayout>
    );
  }

  if (state === 'failed') {
    return (
      <AuthLayout
        title={copy.auth.linkDidNotWork}
        subtitle={!token ? copy.auth.linkCut : (message ?? copy.auth.somethingWrong)}
      >
        <Button asChild fullWidth>
          <Link to="/settings">{copy.auth.backToSettings}</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={copy.auth.emailChanged} subtitle={copy.auth.nowSignsInAs(email ?? '')}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">
          {/* Said plainly, because being signed out unexpectedly reads as something going
              wrong rather than as the safeguard it is. */}
          {copy.auth.signedOutEverywhere}
        </p>
        <Button asChild fullWidth>
          <Link to="/login">{copy.auth.signInWithNew}</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
