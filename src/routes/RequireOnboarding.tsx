import { type ReactNode, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@/components/atoms';
import { useBusinessStore } from '@/stores';

export interface RequireOnboardingProps {
  children: ReactNode;
}

/**
 * Holds app pages until the provider profile is known, then sends anyone who has not
 * finished the wizard to /onboarding. Sits inside ProtectedRoute, so a token exists here.
 */
export function RequireOnboarding({ children }: RequireOnboardingProps) {
  const profile = useBusinessStore((state) => state.profile);
  const status = useBusinessStore((state) => state.status);
  const error = useBusinessStore((state) => state.error);
  const load = useBusinessStore((state) => state.load);

  /** How many times we have asked. Two is the ceiling — this is a guard, not a retry loop. */
  const attempts = useRef(0);

  useEffect(() => {
    if (profile || status !== 'idle') return;
    // Retry once past an error, then stop and let the app render.
    if (error && attempts.current > 1) return;

    attempts.current += 1;
    void load();
  }, [profile, status, error, load]);

  if (!profile) {
    // A failed load still falls through to the app rather than trapping the provider on a
    // spinner; the page itself will surface the error. **But only after one retry.** This
    // guard is the only thing standing between a brand-new account and the dashboard, and a
    // single flaky request used to be enough to skip the wizard permanently — the profile is
    // then loaded, `onboardedAt` is absent, and nothing looks at it again.
    return error && attempts.current > 1 ? (
      children
    ) : (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-6 text-brand-ink" label="Loading your workspace" />
      </div>
    );
  }

  if (!profile.onboardedAt) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
