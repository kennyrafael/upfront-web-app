import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, SignupForm } from '@/components';
import { useCopy } from '@/lib';

export function SignupPage() {
  const navigate = useNavigate();
  const copy = useCopy();

  return (
    <AuthLayout
      title={copy.auth.createTitle}
      subtitle={copy.auth.createSubtitle}
      footer={
        <>
          {copy.auth.haveAccount}{' '}
          <Link to="/login" className="font-medium text-white underline-offset-2 hover:underline">
            {copy.auth.signIn}
          </Link>
        </>
      }
    >
      {/* Straight to the wizard, not through `/`. An account created a second ago cannot be
          onboarded, so bouncing off the app shell only bought a "Loading your workspace"
          spinner on the way — and, when the profile request failed, `RequireOnboarding` fell
          through to the dashboard and the wizard was skipped entirely. */}
      <SignupForm onSuccess={() => navigate('/onboarding', { replace: true })} />
    </AuthLayout>
  );
}
