import { useEffect } from 'react';
import { DashboardLayout, ProviderProfileForm } from '@/components';
import { useProviderStore } from '@/stores';

export function SettingsPage() {
  const load = useProviderStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout title="Settings" description="Your business details and the hours you work.">
      <ProviderProfileForm />
    </DashboardLayout>
  );
}
