import type { ReactNode } from 'react';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider shell for the onboarding wizard, which carries more than a login form. */
  size?: 'md' | 'lg';
}

export function AuthLayout({ title, subtitle, children, footer, size = 'md' }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      {/* Deep green field behind the frosted card. Fixed so it does not scroll away
          on short viewports where the form overflows. */}
      <div
        aria-hidden="true"
        // `backdrop` rather than `brand-900`: the ramp's dark end becomes light under the
        // dark theme, and this field has to stay deep green in both.
        className="fixed inset-0 -z-10 bg-backdrop bg-[radial-gradient(50rem_36rem_at_20%_0%,oklch(0.46_0.083_162/0.55),transparent_60%),radial-gradient(42rem_32rem_at_90%_100%,oklch(0.55_0.09_162/0.4),transparent_55%)]"
      />

      <div className={size === 'lg' ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
        <p className="mb-8 text-center text-2xl font-semibold tracking-tight text-white">Upfront</p>

        <div className="rounded-2xl bg-sheet/92 p-8 shadow-raised ring-1 ring-hairline backdrop-blur-2xl">
          <h1 className="text-xl font-semibold text-brand-900">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-6 text-center text-sm text-onbackdrop">{footer}</div> : null}
      </div>
    </div>
  );
}
