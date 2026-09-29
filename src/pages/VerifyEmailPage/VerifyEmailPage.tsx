import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout, Button, Spinner } from '@/components';
import { useCopy } from '@/lib';
import { ApiError, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

export function VerifyEmailPage() {
  const copy = useCopy();
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
        // The server's own words when it has some; ours are chosen at render, in whatever
        // language is showing then.
        setMessage(error instanceof ApiError ? error.message : undefined);
      }
    })();
  }, [token, markVerified, signedIn]);

  if (state === 'working') {
    return (
      <AuthLayout title={copy.auth.confirmingEmail}>
        <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
          <Spinner className="size-4 text-brand-ink" /> {copy.auth.oneMoment}
        </p>
      </AuthLayout>
    );
  }

  if (state === 'failed') {
    return (
      <AuthLayout title={copy.auth.linkDidNotWork}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            {!token ? copy.auth.linkCut : (message ?? copy.auth.somethingWrong)}
          </p>
          <p className="text-sm text-ink-muted">{copy.auth.linksExpire}</p>
          <Link to={signedIn ? '/settings' : '/login'}>
            <Button fullWidth>{signedIn ? copy.auth.goToSettings : copy.auth.signIn}</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={copy.auth.emailConfirmed}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">{copy.auth.thanks}</p>
        {/* `#page` because this button says "publish your page", and plain `/settings` opens the
            profile tab — so the one moment a provider is told to go and publish handed them a
            form about their own name instead. The failure path above keeps the bare path: it
            only offers to take them to settings. */}
        <Link to={signedIn ? '/settings#page' : '/login'}>
          <Button fullWidth>{signedIn ? copy.auth.publishPage : copy.auth.signIn}</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
