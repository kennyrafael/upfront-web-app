import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores';

export interface DashboardLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/clients', label: 'Clients' },
  { to: '/services', label: 'Services' },
  { to: '/compliance', label: 'Compliance' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const provider = useAuthStore((state) => state.provider);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <span className="text-lg font-semibold tracking-tight text-brand-700">Upfront</span>
          <nav className="hidden gap-1 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{provider?.name}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
