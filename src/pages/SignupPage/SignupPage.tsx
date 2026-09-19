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
      <SignupForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
