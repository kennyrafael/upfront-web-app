import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { resetDomainStores, useAuthStore } from '@/stores';

export interface DashboardLayoutProps {
  title?: string;
  description?: string;
  /** Actions rendered beside the page title, e.g. a "New service" button. */
  actions?: ReactNode;
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/services', label: 'Services' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/clients', label: 'Clients' },
  { to: '/compliance', label: 'Compliance' },
  { to: '/settings', label: 'Settings' },
];

export function DashboardLayout({ title, description, actions, children }: DashboardLayoutProps) {
  const provider = useAuthStore((state) => state.provider);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-hairline bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <span className="text-lg font-semibold tracking-tight text-brand-800">Upfront</span>

          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-700/10 text-brand-800'
                      : 'text-ink-muted hover:bg-brand-700/6 hover:text-brand-800',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{provider?.name}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                resetDomainStores();
                logout();
              }}
            >
              Sign out
            </Button>
          </div>
        </div>

        {/* The nav collapses out of the bar on phones; keep it reachable below it. */}
        <nav className="flex gap-1 overflow-x-auto border-t border-hairline px-4 py-2 sm:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-700/10 text-brand-800' : 'text-ink-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {title ? (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-brand-900">{title}</h1>
              {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
            </div>
            {actions ? <div className="flex gap-2">{actions}</div> : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
