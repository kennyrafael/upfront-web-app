import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, SignupForm } from '@/components';

export function SignupPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your provider profile — it takes about a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-white underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
