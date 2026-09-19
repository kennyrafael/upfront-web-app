import { type ReactNode, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName, Tooltip, TooltipProvider } from '@/components/atoms';
import { AccountMenu } from '@/components/organisms/AccountMenu';
import { NotificationBell } from '@/components/organisms/NotificationBell';
import { VerifyEmailNotice } from '@/components/organisms/VerifyEmailNotice';
import { useCopy } from '@/lib';
import type { AuthenticatedUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';

export interface DashboardLayoutProps {
  title?: string;
  description?: string;
  /** Actions rendered beside the page title, e.g. a "New service" button. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * The sidebar is the work; the top bar is the account.
 *
 * Settings is deliberately absent here even though it is a page like any other — it lives
 * behind the avatar with the profile and sign-out, because those three are all "about me"
 * rather than "about the business", and grouping them is what lets the sidebar stay a list
 * of places to work.
 */
/**
 * `roles` names who may see a link, and absent means everybody.
 *
 * The server refuses these pages regardless — this only stops the app offering somebody a
 * door that opens onto a 403. Hiding is a courtesy, never the control.
 */
type Role = AuthenticatedUser['role'];
type NavKey = 'overview' | 'services' | 'bookings' | 'clients' | 'payments' | 'compliance';

/** `labelKey` rather than a label: the list is module-level and the language is not. */
const NAV_ITEMS: { to: string; labelKey: NavKey; icon: IconName; roles?: Role[] }[] = [
  { to: '/', labelKey: 'overview', icon: 'overview' },
  { to: '/services', labelKey: 'services', icon: 'services' },
  { to: '/bookings', labelKey: 'bookings', icon: 'bookings' },
  { to: '/clients', labelKey: 'clients', icon: 'clients' },
  // A front desk takes money — that is the job. Staff are not on the payments desk.
  {
    to: '/payments',
    labelKey: 'payments',
    icon: 'payments',
    roles: ['owner', 'manager', 'front_desk'],
  },
  // A recibo is issued against one person's NIF, so the whole of compliance is theirs.
  { to: '/compliance', labelKey: 'compliance', icon: 'compliance', roles: ['owner'] },
];

/**
 * The width at which a persistent sidebar earns its place.
 *
 * `lg` rather than `md`, because 240px of navigation out of a 768px window is a third of
 * the screen spent on six links — and what is left over is too narrow for the forms, which
 * wrap into unreadable stacks. Below this the sidebar is a drawer and the content gets the
 * whole width.
 */

/** Remembered per browser: a provider who works collapsed should stay collapsed. */
const COLLAPSED_KEY = 'upfront.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    // Private windows and blocked site data both throw here. A sidebar preference is not
    // worth a crash, so the default stands.
    return false;
  }
}

export function DashboardLayout({ title, description, actions, children }: DashboardLayoutProps) {
  const copy = useCopy();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  /** Separate from `collapsed`: on a phone the sidebar is a drawer, not a narrow rail. */
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      // See readCollapsed.
    }
  }, [collapsed]);

  const role = useAuthStore((state) => state.user?.role);
  const visibleNav = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {visibleNav.map((item) => (
        // A tooltip only while collapsed, because that is the only time the label is not
        // already on screen. `sr-only` keeps the accessible name either way.
        <Tooltip key={item.to} label={collapsed ? copy.nav[item.labelKey] : undefined}>
          <NavLink
            to={item.to}
            end={item.to === '/'}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                isActive
                  ? 'bg-brand-700/12 text-brand-800'
                  : 'text-ink-muted hover:bg-brand-700/6 hover:text-brand-800',
              )
            }
          >
            <Icon name={item.icon} />
            <span className={cn(collapsed && 'sr-only')}>{copy.nav[item.labelKey]}</span>
          </NavLink>
        </Tooltip>
      ))}
    </nav>
  );

  return (
    // One provider for the whole shell: Radix shares its open delay across every tooltip
    // beneath it, so running a cursor down the rail does not re-wait at each icon.
    <TooltipProvider>
      <div className="min-h-dvh lg:flex">
        {drawerOpen && (
          <>
            <button
              type="button"
              aria-label={copy.nav.closeMenu}
              onClick={() => setDrawerOpen(false)}
              // No opacity modifier: Radix's overlay already carries the alpha it wants, and
              // thinning it further leaves the page behind barely dimmed.
              className="fixed inset-0 z-40 bg-scrim lg:hidden"
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sheet shadow-xl lg:hidden">
              <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
                <span className="font-semibold tracking-tight text-brand-800">Upfront</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-2 text-ink-muted hover:bg-brand-700/8"
                >
                  <Icon name="close" label={copy.nav.closeMenu} />
                </button>
              </div>
              {nav}
            </aside>
          </>
        )}

        {/**
         * No `backdrop-blur` here, unlike the header.
         *
         * It was blurring nothing. The rail is a flex sibling of the content rather than
         * an overlay, and it runs the full height — so what sits behind it is the flat page
         * background, and blurring a flat colour returns the same flat colour. Removing it
         * is pixel-for-pixel identical, checked rather than assumed.
         *
         * What it did cost is a composited backdrop root on a `position: sticky` element,
         * which is the combination Chromium has a history of painting at a stale size until
         * something invalidates the layer — a resize, usually. That matches a first-load
         * layout bug reported on Opera and not reproducible in Chrome, so the suspect is
         * removed on the grounds that it earns nothing either way.
         */}
        <aside
          className={cn(
            'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-hairline bg-sheet/60 transition-[width] duration-200 lg:flex',
            collapsed ? 'w-16' : 'w-60',
          )}
        >
          <div
            className={cn(
              'flex h-14 items-center border-b border-hairline px-3',
              collapsed ? 'justify-center' : 'justify-between',
            )}
          >
            {!collapsed && (
              <span className="px-2 font-semibold tracking-tight text-brand-800">Upfront</span>
            )}
            <Tooltip label={collapsed ? copy.nav.expandMenu : copy.nav.collapseMenu}>
              <button
                type="button"
                onClick={() => setCollapsed((value) => !value)}
                className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-brand-700/8 hover:text-brand-800"
              >
                <Icon
                  name={collapsed ? 'expand' : 'collapse'}
                  className="size-4"
                  label={collapsed ? copy.nav.expandMenu : copy.nav.collapseMenu}
                />
              </button>
            </Tooltip>
          </div>
          {nav}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-sheet/80 px-4 backdrop-blur-xl md:px-8">
            {/* Phone: the drawer trigger takes the place the sidebar would. */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-brand-800 hover:bg-brand-700/8 lg:hidden"
            >
              <Icon name="menu" label={copy.nav.openMenu} />
            </button>
            <span className="font-semibold tracking-tight text-brand-800 lg:hidden">Upfront</span>

            <div className="ml-auto flex items-center gap-1.5">
              <NotificationBell />
              <AccountMenu />
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
            <div className="mx-auto max-w-5xl">
              {title ? (
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-brand-900">
                      {title}
                    </h1>
                    {description ? (
                      <p className="mt-1 text-sm text-ink-muted">{description}</p>
                    ) : null}
                  </div>
                  {actions ? <div className="flex gap-2">{actions}</div> : null}
                </div>
              ) : null}

              {/* Shown on every screen until the address is confirmed, then it disappears by
                itself. One place rather than remembering to add it to each page. */}
              <VerifyEmailNotice />

              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
