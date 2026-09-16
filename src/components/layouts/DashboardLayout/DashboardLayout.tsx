import { type ReactNode, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button, Icon, type IconName } from '@/components/atoms';
import { VerifyEmailNotice } from '@/components/organisms/VerifyEmailNotice';
import { cn } from '@/lib/utils';
import { resetDomainStores, useAuthStore } from '@/stores';

export interface DashboardLayoutProps {
  title?: string;
  description?: string;
  /** Actions rendered beside the page title, e.g. a "New service" button. */
  actions?: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Overview', icon: 'overview' },
  { to: '/services', label: 'Services', icon: 'services' },
  { to: '/bookings', label: 'Bookings', icon: 'bookings' },
  { to: '/clients', label: 'Clients', icon: 'clients' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
  { to: '/compliance', label: 'Compliance', icon: 'compliance' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

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
  const provider = useAuthStore((state) => state.provider);
  const logout = useAuthStore((state) => state.logout);

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

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => setDrawerOpen(false)}
          // The label is the accessible name whether or not it is visible, so a collapsed
          // rail is still navigable by screen reader and hover alike.
          title={collapsed ? item.label : undefined}
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
          <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const account = (
    <div className="border-t border-hairline p-3">
      {!collapsed && (
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-medium text-brand-900">{provider?.name}</p>
          <p className="truncate text-xs text-ink-muted">
            {provider?.businessName ?? provider?.email}
          </p>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        title={collapsed ? 'Sign out' : undefined}
        onClick={() => {
          resetDomainStores();
          void logout();
        }}
      >
        <span className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <Icon name="logout" className="size-4" />
          <span className={cn(collapsed && 'sr-only')}>Sign out</span>
        </span>
      </Button>
    </div>
  );

  return (
    <div className="min-h-dvh md:flex">
      {/* Phone: a top bar with a drawer trigger, because a rail would eat a quarter of the
          screen on a device that has none to spare. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-white/80 px-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-lg p-2 text-brand-800 hover:bg-brand-700/8"
        >
          <Icon name="menu" label="Open menu" />
        </button>
        <span className="font-semibold tracking-tight text-brand-800">Upfront</span>
      </header>

      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-brand-950/30 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
              <span className="font-semibold tracking-tight text-brand-800">Upfront</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-ink-muted hover:bg-brand-700/8"
              >
                <Icon name="close" label="Close menu" />
              </button>
            </div>
            {nav}
            {account}
          </aside>
        </>
      )}

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-hairline bg-white/60 backdrop-blur-xl transition-[width] duration-200 md:flex',
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
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-brand-700/8 hover:text-brand-800"
          >
            <Icon
              name={collapsed ? 'expand' : 'collapse'}
              className="size-4"
              label={collapsed ? 'Expand menu' : 'Collapse menu'}
            />
          </button>
        </div>
        {nav}
        {account}
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-5xl">
          {title ? (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{title}</h1>
                {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
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
  );
}
