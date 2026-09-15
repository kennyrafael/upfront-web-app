import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, LoginForm } from '@/components';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Manage your bookings, clients and recibos in one place."
      footer={
        <div className="flex flex-col gap-1">
          <span>
            New to Upfront?{' '}
            <Link
              to="/signup"
              className="font-medium text-white underline-offset-2 hover:underline"
            >
              Create an account
            </Link>
          </span>
          <Link
            to="/forgot-password"
            className="font-medium text-white/80 underline-offset-2 hover:underline"
          >
            Forgotten your password?
          </Link>
        </div>
      }
    >
      <LoginForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
