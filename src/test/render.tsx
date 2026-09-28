import { Theme } from '@radix-ui/themes';
import { type RenderOptions, render as rtlRender } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { LocaleProvider } from '@/lib/i18n';

/**
 * Renders inside the two providers the app always has around it.
 *
 * `Theme` because every atom is a Radix Themes component and several read its context; without
 * it they render unstyled and some not at all. `LocaleProvider` because anything reaching for
 * `useCopy` throws "must be used inside a LocaleProvider" — a real error that filled the
 * console before this existed, not a testing artefact.
 *
 * The locale is whatever `readLocale` decides, which with no stored preference is pt-PT — the
 * product's default, so tests see what a provider sees.
 */
function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <Theme>{children}</Theme>
    </LocaleProvider>
  );
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: Providers, ...options });
}

export * from '@testing-library/react';
