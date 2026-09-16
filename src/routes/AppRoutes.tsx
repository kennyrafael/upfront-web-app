import { type ReactNode, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import {
  BookingsPage,
  ChangeEmailPage,
  ClientsPage,
  CompliancePage,
  DashboardPage,
  ForgotPasswordPage,
  LoginPage,
  ManageBookingPage,
  OnboardingPage,
  PaymentsPage,
  PublicBookingPage,
  ResetPasswordPage,
  ServicesPage,
  SettingsPage,
  SignupPage,
  VerifyEmailPage,
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
        {/*
          Public, and deliberately outside ProtectedRoute and RequireOnboarding: these are
          for clients who have no account and never will. A signed-in user opening
          their own booking link sees exactly what a stranger sees.
        */}
        <Route path="/book/:slug" element={<PublicBookingPage />} />
        <Route path="/booking/:token" element={<ManageBookingPage />} />

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
        {/*
          Reachable signed out, because that is the state everyone who needs them is in.
          `/verify-email` is deliberately not GuestOnly: a user usually clicks it from
          their inbox while already signed in, and bouncing them home would leave the
          address unconfirmed with no explanation.
        */}
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Not GuestOnly, for the same reason: the link is usually opened from an inbox,
            on a device that may or may not be signed in. */}
        <Route path="/change-email" element={<ChangeEmailPage />} />

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
