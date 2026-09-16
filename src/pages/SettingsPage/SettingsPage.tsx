import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BrandingSettings,
  DashboardLayout,
  ProviderProfileForm,
  PublicBookingSettings,
  SignInSettings,
} from '@/components';
import { useProviderStore } from '@/stores';

export function SettingsPage() {
  const load = useProviderStore((state) => state.load);
  const { hash } = useLocation();

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * React Router does not scroll to a hash by itself, and this page is long enough that
   * arriving at the top from "Your profile" looks like the link did nothing.
   */
  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <DashboardLayout title="Settings" description="Your business details and the hours you work.">
      <ProviderProfileForm />

      <div className="mt-6">
        <SignInSettings />
      </div>

      <div className="mt-6">
        <PublicBookingSettings />
      </div>

      <div className="mt-6">
        <BrandingSettings />
      </div>
    </DashboardLayout>
  );
}
