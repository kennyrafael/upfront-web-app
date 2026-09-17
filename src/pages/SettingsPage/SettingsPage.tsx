import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BrandingSettings,
  BusinessProfileForm,
  DashboardLayout,
  MyDetailsForm,
  PeopleSettings,
  PublicBookingSettings,
  SignInSettings,
} from '@/components';
import { useAuthStore, useBusinessStore } from '@/stores';

export function SettingsPage() {
  const load = useBusinessStore((state) => state.load);
  const role = useAuthStore((state) => state.user?.role);
  const { hash } = useLocation();

  /**
   * The shop's settings are an owner-or-manager page, and the server refuses them for
   * anybody else. Hiding them means a stylist opening Settings finds their own details and
   * their sign-in card, rather than four forms that all answer 403.
   *
   * The server is still the control. This only stops the app offering a door that does not
   * open.
   */
  const runsTheShop = role === 'owner' || role === 'manager';

  useEffect(() => {
    if (!runsTheShop) return;
    void load();
  }, [load, runsTheShop]);

  /**
   * React Router does not scroll to a hash by itself, and this page is long enough that
   * arriving at the top from "Your profile" looks like the link did nothing.
   */
  useEffect(() => {
    if (!hash) return;
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <DashboardLayout title="Settings" description="Your details, and the shop's.">
      <MyDetailsForm />

      <div className="mt-6">
        <SignInSettings />
      </div>

      {runsTheShop ? (
        <>
          <div className="mt-6">
            <BusinessProfileForm />
          </div>

          <div className="mt-6">
            <PeopleSettings />
          </div>

          <div className="mt-6">
            <PublicBookingSettings />
          </div>

          <div className="mt-6">
            <BrandingSettings />
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
