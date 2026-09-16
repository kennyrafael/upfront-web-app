import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, BusinessOnboardingForm } from '@/components';
import { useBusinessStore } from '@/stores';

export function OnboardingPage() {
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

  return (
    <AuthLayout
      title="Set up your workspace"
      subtitle="Three short steps. You can change any of this later in Settings."
    >
      <BusinessOnboardingForm onDone={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
