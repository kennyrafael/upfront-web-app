import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout, LoginForm } from '@/components';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Manage your bookings, clients and recibos in one place."
      footer={
        <>
          New to Upfront?{' '}
          <Link to="/signup" className="font-medium text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={() => navigate('/', { replace: true })} />
    </AuthLayout>
  );
}
