import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, BusinessOnboardingForm } from '@/components';
import { useCopy } from '@/lib';
import { useBusinessStore } from '@/stores';

export function OnboardingPage() {
  const copy = useCopy();
  const navigate = useNavigate();
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

  // The wide shell, which is what `size` exists for — the wizard carries a schedule editor,
  // not a login form, and at `md` its rows had 360px of space for 416px of controls.
  return (
    <AuthLayout size="lg" title={copy.onboarding.title} subtitle={copy.onboarding.subtitle}>
      <BusinessOnboardingForm onDone={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
