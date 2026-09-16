import type { ReactNode } from 'react';
import { brandStyle } from '@/lib/utils';

export interface PublicLayoutProps {
  businessName?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Wider shell for the slot grid, which needs room to breathe. */
  size?: 'md' | 'lg';
  /** `#RRGGBB` chosen by the provider. Absent means Upfront's green. */
  brandColor?: string;
  /** Replaces the business name at the top when the provider has uploaded one. */
  logoUrl?: string;
}

/**
 * The shell a client sees. Deliberately not `DashboardLayout` — there is no nav, no
 * account and nothing to sign out of, and the provider's business is the only brand on
 * the page. Upfront's name appears once, small, at the bottom.
 *
 * `brandStyle` redefines the brand ramp on this element, so every `brand-*` class below it —
 * buttons, rings, slot chips — takes the provider's colour without anything being passed
 * down. Nothing inside needs to know the page is themed.
 */
export function PublicLayout({
  businessName,
  title,
  subtitle,
  children,
  size = 'md',
  brandColor,
  logoUrl,
}: PublicLayoutProps) {
  return (
    <div
      style={brandStyle(brandColor)}
      className="relative flex min-h-dvh flex-col items-center px-4 py-10"
    >
      {/* Painted from the ramp rather than fixed oklch values, so it follows the colour too. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-brand-900"
        style={{
          backgroundImage:
            'radial-gradient(50rem 36rem at 20% 0%, color-mix(in oklab, var(--color-brand-600) 55%, transparent), transparent 60%), radial-gradient(42rem 32rem at 90% 100%, color-mix(in oklab, var(--color-brand-500) 40%, transparent), transparent 55%)',
        }}
      />

      <div className={size === 'lg' ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
        {logoUrl ? (
          <div className="mb-6 flex justify-center">
            {/* Their mark, at whatever aspect ratio it has. Alt is empty because the business
                name is announced by the page title right underneath. */}
            <img src={logoUrl} alt="" className="max-h-16 max-w-56 object-contain" />
          </div>
        ) : businessName ? (
          // White always works here: brandStyle pins brand-900 to a fixed darkness, so the
          // backdrop behind this is dark whatever colour the provider picked.
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
