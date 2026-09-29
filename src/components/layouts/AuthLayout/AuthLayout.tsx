import { Theme } from '@radix-ui/themes';
import type { ReactNode } from 'react';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider shell for the onboarding wizard, which carries more than a login form. */
  size?: 'md' | 'lg';
}

/**
 * The signed-out shell: sign in, sign up, the password pages and the onboarding wizard.
 *
 * **Pinned to jade and to light, and that is the whole reason this nests a `Theme`.** The
 * accent and the light/dark choice live in `localStorage` under `upfront.theme` and
 * `upfront.accent` — they are a *viewer's* preference on a *device*, not a property of any
 * business. `App.tsx` wraps every route in them, so a stranger signing up on a machine where
 * somebody once picked purple and dark met a purple, dark sign-in page belonging to a
 * business they have never heard of.
 *
 * Same fix, and the same reasoning, as `PublicLayout`: a nested `Theme` with no accent of its
 * own would inherit the root's, so the accent is named rather than merely reset.
 */
export function AuthLayout({ title, subtitle, children, footer, size = 'md' }: AuthLayoutProps) {
  return (
    <Theme
      appearance="light"
      accentColor="jade"
      grayColor="sage"
      radius="large"
      hasBackground={false}
      className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12"
    >
      {/* Deep green field behind the frosted card. Fixed so it does not scroll away
          on short viewports where the form overflows. */}
      <div
        aria-hidden="true"
        /**
         * Painted from the accent, not from fixed green.
         *
         * It used to be three hardcoded oklch values, which meant a business that chose
         * purple got a purple app and a green sign-in screen — the one page you look at
         * before anything else.
         *
         * The base is the accent mixed hard into near-black rather than a step from the
         * ramp. Steps flip between appearances, so `--accent-12` is a near-black green in
         * light and a pale mint in dark; mixing takes the hue and fixes the darkness, which
         * is what this field needs in both. The two washes use the mid steps, as the public
         * booking page already does.
         */
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: 'color-mix(in oklab, var(--accent-9) 20%, #070b09)',
          backgroundImage:
            'radial-gradient(50rem 36rem at 20% 0%, color-mix(in oklab, var(--color-brand-600) 55%, transparent), transparent 60%), radial-gradient(42rem 32rem at 90% 100%, color-mix(in oklab, var(--color-brand-500) 40%, transparent), transparent 55%)',
        }}
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
    </Theme>
  );
}
