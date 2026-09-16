import { useEffect } from 'react';
import {
  BrandingSettings,
  DashboardLayout,
  ProviderProfileForm,
  PublicBookingSettings,
} from '@/components';
import { useProviderStore } from '@/stores';

export function SettingsPage() {
  const load = useProviderStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout title="Settings" description="Your business details and the hours you work.">
      <ProviderProfileForm />

      <div className="mt-6">
        <PublicBookingSettings />
      </div>

      <div className="mt-6">
        <BrandingSettings />
      </div>
    </DashboardLayout>
  );
}
