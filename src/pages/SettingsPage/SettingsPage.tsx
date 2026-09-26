import { Tabs } from '@radix-ui/themes';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BrandingSettings,
  BusinessProfileForm,
  DashboardLayout,
  MyDetailsForm,
  PaymentsSettings,
  PayoutDetailsForm,
  PeopleSettings,
  PublicBookingSettings,
  RemindersSettings,
  SignInSettings,
} from '@/components';
import { useCopy } from '@/lib';
import { useAuthStore, useBusinessStore } from '@/stores';

/**
 * The tab a hash selects, including the two that predate the tabs.
 *
 * `#profile` and `#me` were anchors on a single long page, and the account menu still
 * links to one of them. Mapping them rather than renaming them means an old link, a
 * bookmark or somebody's open tab still lands somewhere sensible.
 */
const TAB_FOR_HASH: Record<string, string> = {
  '#you': 'you',
  '#me': 'you',
  '#profile': 'business',
  '#business': 'business',
  '#people': 'people',
  '#page': 'page',
  '#payments': 'payments',
};

export function SettingsPage() {
  const copy = useCopy();
  const load = useBusinessStore((state) => state.load);
  const role = useAuthStore((state) => state.user?.role);
  const { hash } = useLocation();
  const navigate = useNavigate();

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
   * The hash chooses the tab, and a tab that is not theirs falls back to the one everybody
   * has. Reading it on every render rather than holding it in state keeps one source of
   * truth: the URL is the tab, so a deep link, a reload and the back button all agree.
   */
  const requested = TAB_FOR_HASH[hash] ?? 'you';
  const tab = !runsTheShop && requested !== 'you' ? 'you' : requested;

  return (
    <DashboardLayout title={copy.settings.title} description={copy.settings.lede}>
      <Tabs.Root
        value={tab}
        onValueChange={(next) =>
          // Replaced, not pushed. Four tabs pushed onto history means four presses of back
          // to leave a page you only visited once.
          navigate(`#${next}`, { replace: true })
        }
      >
        <Tabs.List>
          <Tabs.Trigger value="you">{copy.settings.tabYou}</Tabs.Trigger>
          {runsTheShop ? (
            <>
              <Tabs.Trigger value="business">{copy.settings.tabBusiness}</Tabs.Trigger>
              <Tabs.Trigger value="people">{copy.settings.tabPeople}</Tabs.Trigger>
              <Tabs.Trigger value="page">{copy.settings.tabPage}</Tabs.Trigger>
              <Tabs.Trigger value="payments">{copy.settings.tabPayments}</Tabs.Trigger>
            </>
          ) : null}
        </Tabs.List>

        {/* `mt-6` on the panel rather than the cards: every tab wants the same gap, and
            spacing the first card of each one separately is how they end up different. */}
        <div className="mt-6 flex flex-col gap-6">
          <Tabs.Content value="you" className="flex flex-col gap-6">
            <MyDetailsForm />
            <SignInSettings />
          </Tabs.Content>

          {runsTheShop ? (
            <>
              {/* Reminders sit with the shop rather than with the booking page: they fire
                  for an appointment taken over the counter just as much as for one booked
                  online. Read-only for now — what a provider cannot otherwise see is whether
                  SMS is on their plan and how much of the month's allowance is left. */}
              <Tabs.Content value="business" className="flex flex-col gap-6">
                <BusinessProfileForm />
                <RemindersSettings />
              </Tabs.Content>

              <Tabs.Content value="people">
                <PeopleSettings />
              </Tabs.Content>

              {/* Branding lives with the booking page because that is the only thing it
                  changes — the dashboard keeps its own colours whatever is picked here. */}
              <Tabs.Content value="page" className="flex flex-col gap-6">
                <PublicBookingSettings />
                <BrandingSettings />
              </Tabs.Content>

              {/* Its own tab rather than a card under the booking page. Deposits are only
                  half of it — the balance charged at the counter needs this too — and it is
                  the one setting in here that somebody's bank details go through. */}
              <Tabs.Content value="payments">
                <div className="flex flex-col gap-6">
                  <PaymentsSettings />
                  <PayoutDetailsForm />
                </div>
              </Tabs.Content>
            </>
          ) : null}
        </div>
      </Tabs.Root>
    </DashboardLayout>
  );
}
