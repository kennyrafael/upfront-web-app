import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { DashboardPage, LoginPage, SignupPage } from '@/pages';
import { useAuthStore } from '@/stores';
import { ProtectedRoute } from './ProtectedRoute';

function GuestOnly({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return accessToken ? <Navigate to="/" replace /> : <>{children}</>;
}

export function AppRoutes() {
  const restore = useAuthStore((state) => state.restore);

  // Revalidates a persisted token once on boot.
  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <SignupPage />
            </GuestOnly>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
