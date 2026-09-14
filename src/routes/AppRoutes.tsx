import { type ReactNode, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import {
  BookingsPage,
  ClientsPage,
  CompliancePage,
  DashboardPage,
  LoginPage,
  OnboardingPage,
  PaymentsPage,
  ServicesPage,
  SettingsPage,
  SignupPage,
} from '@/pages';
import { useAuthStore } from '@/stores';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireOnboarding } from './RequireOnboarding';

function GuestOnly({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  return accessToken ? <Navigate to="/" replace /> : <>{children}</>;
}

/** Signed in, onboarded, and inside the app shell. */
function AppPage({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <RequireOnboarding>{children}</RequireOnboarding>
    </ProtectedRoute>
  );
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
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <AppPage>
              <DashboardPage />
            </AppPage>
          }
        />
        <Route
          path="/services"
          element={
            <AppPage>
              <ServicesPage />
            </AppPage>
          }
        />
        <Route
          path="/bookings"
          element={
            <AppPage>
              <BookingsPage />
            </AppPage>
          }
        />
        <Route
          path="/clients"
          element={
            <AppPage>
              <ClientsPage />
            </AppPage>
          }
        />
        <Route
          path="/payments"
          element={
            <AppPage>
              <PaymentsPage />
            </AppPage>
          }
        />
        <Route
          path="/compliance"
          element={
            <AppPage>
              <CompliancePage />
            </AppPage>
          }
        />
        <Route
          path="/settings"
          element={
            <AppPage>
              <SettingsPage />
            </AppPage>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
