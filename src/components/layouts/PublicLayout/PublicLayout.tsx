import type { ReactNode } from 'react';

export interface PublicLayoutProps {
  businessName?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Wider shell for the slot grid, which needs room to breathe. */
  size?: 'md' | 'lg';
}

/**
 * The shell a client sees. Deliberately not `DashboardLayout` — there is no nav, no
 * account and nothing to sign out of, and the provider's business is the only brand on
 * the page. Upfront's name appears once, small, at the bottom.
 */
export function PublicLayout({
  businessName,
  title,
  subtitle,
  children,
  size = 'md',
}: PublicLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center px-4 py-10">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-brand-900 bg-[radial-gradient(50rem_36rem_at_20%_0%,oklch(0.46_0.083_162/0.55),transparent_60%),radial-gradient(42rem_32rem_at_90%_100%,oklch(0.55_0.09_162/0.4),transparent_55%)]"
      />

      <div className={size === 'lg' ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
        {businessName ? (
          <p className="mb-6 text-center text-2xl font-semibold tracking-tight text-white">
            {businessName}
          </p>
        ) : null}

        <div className="rounded-2xl bg-white/92 p-6 shadow-raised ring-1 ring-white/20 backdrop-blur-2xl sm:p-8">
          {title ? <h1 className="text-xl font-semibold text-brand-900">{title}</h1> : null}
          {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
          <div className={title ? 'mt-6' : ''}>{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-brand-100/80">Booking powered by Upfront</p>
      </div>
    </div>
  );
}
