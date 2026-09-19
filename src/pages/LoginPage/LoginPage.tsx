import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, LoginForm } from '@/components';
import { useCopy } from '@/lib';

export function LoginPage() {
  const navigate = useNavigate();
  const copy = useCopy();

  return (
    <AuthLayout
      title={copy.auth.signIn}
      subtitle={copy.auth.signInSubtitle}
      footer={
        <div className="flex flex-col gap-1">
          <span>
            {copy.auth.newHere}{' '}
            <Link
              to="/signup"
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              {copy.auth.createAccount}
            </Link>
          </span>
          <Link
            to="/forgot-password"
            className="font-medium text-white/80 underline-offset-2 hover:underline"
          >
            {copy.auth.forgotPassword}
          </Link>
        </div>
      }
    >
      <LoginForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
