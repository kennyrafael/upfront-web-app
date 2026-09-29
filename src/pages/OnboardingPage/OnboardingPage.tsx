import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout, BusinessOnboardingForm } from '@/components';
import { useCopy } from '@/lib';
import { useBusinessStore } from '@/stores';

export function OnboardingPage() {
  const copy = useCopy();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const load = useBusinessStore((state) => state.load);
  const profile = useBusinessStore((state) => state.profile);

  useEffect(() => {
    void load();
  }, [load]);

  // Someone who already finished has no business here.
  useEffect(() => {
    if (profile?.onboardedAt) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  /**
   * How checkout went, if they came through it.
   *
   * Said here because this is where they land either way. **Neither message blocks anything** —
   * the wizard is the same wizard whether they paid or walked away from the card form, and the
   * cancelled one says what still happened rather than what did not.
   */
  const subscription = params.get('assinatura');

  // The wide shell, which is what `size` exists for — the wizard carries a schedule editor,
  // not a login form, and at `md` its rows had 360px of space for 416px of controls.
  return (
    <AuthLayout size="lg" title={copy.onboarding.title} subtitle={copy.onboarding.subtitle}>
      {subscription === 'ok' ? (
        <p className="mb-4 rounded-lg bg-good/12 px-3 py-2 text-good-ink text-sm" role="status">
          {copy.onboarding.subscriptionOk}
        </p>
      ) : null}
      {subscription === 'cancelada' ? (
        <p className="mb-4 rounded-lg bg-warn/12 px-3 py-2 text-sm text-warn-ink" role="status">
          {copy.onboarding.subscriptionCancelled}
        </p>
      ) : null}
      <BusinessOnboardingForm onDone={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
