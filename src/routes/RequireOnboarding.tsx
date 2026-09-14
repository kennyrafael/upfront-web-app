import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@/components/atoms';
import { useProviderStore } from '@/stores';

export interface RequireOnboardingProps {
  children: ReactNode;
}

/**
 * Holds app pages until the provider profile is known, then sends anyone who has not
 * finished the wizard to /onboarding. Sits inside ProtectedRoute, so a token exists here.
 */
export function RequireOnboarding({ children }: RequireOnboardingProps) {
  const profile = useProviderStore((state) => state.profile);
  const status = useProviderStore((state) => state.status);
  const error = useProviderStore((state) => state.error);
  const load = useProviderStore((state) => state.load);

  useEffect(() => {
    if (!profile && status === 'idle' && !error) {
      void load();
    }
  }, [profile, status, error, load]);

  if (!profile) {
    // A failed load falls through to the app rather than trapping the provider on a
    // spinner; the page itself will surface the error.
    return error ? (
      <>{children}</>
    ) : (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner className="size-6 text-brand-700" label="Loading your workspace" />
      </div>
    );
  }

  if (!profile.onboardedAt) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
