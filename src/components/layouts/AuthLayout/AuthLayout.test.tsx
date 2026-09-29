import { Theme } from '@radix-ui/themes';
import { render as rtlRender, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '@/lib/i18n';
import { AuthLayout } from './AuthLayout';

/**
 * The signed-out pages must not wear the viewer's dashboard colours.
 *
 * The accent and the light/dark choice live in `localStorage`, which makes them a property of
 * a *browser*, not of a business — and `App.tsx` wraps every route in them. So a stranger
 * signing up on a machine where somebody once picked purple and dark met a purple, dark
 * sign-in page belonging to a business they have never heard of.
 *
 * **This regression would return silently**: nothing throws, nothing fails to render, and the
 * page is only wrong for people who are not looking at their own screen. Hence a test that
 * renders it under the worst case and reads the colours back.
 */
function renderUnderTheme(accentColor: 'purple', appearance: 'dark') {
  return rtlRender(
    <LocaleProvider>
      <Theme accentColor={accentColor} appearance={appearance}>
        <AuthLayout title="Entrar">
          <p>form</p>
        </AuthLayout>
      </Theme>
    </LocaleProvider>,
  );
}

/** The innermost Radix Theme wrapper, which is the one `AuthLayout` owns. */
function innerTheme(container: HTMLElement): HTMLElement {
  const themes = container.querySelectorAll<HTMLElement>('[data-accent-color]');
  const last = themes[themes.length - 1];
  if (!last) throw new Error('AuthLayout rendered no Theme of its own');
  return last;
}

describe('the signed-out shell', () => {
  it('pins its own accent instead of inheriting the viewer’s', () => {
    // Named rather than merely reset: a nested Theme with no accent of its own inherits the
    // root's, which is exactly the bug. Same reasoning as PublicLayout's pinned jade.
    const { container } = renderUnderTheme('purple', 'dark');

    expect(innerTheme(container).getAttribute('data-accent-color')).toBe('jade');
  });

  it('stays light under a dark dashboard', () => {
    const { container } = renderUnderTheme('purple', 'dark');

    expect(innerTheme(container).classList.contains('light')).toBe(true);
    expect(innerTheme(container).classList.contains('dark')).toBe(false);
  });

  it('still renders what it was given', () => {
    // Cheap, and it catches the version of this fix where the Theme swallows its children.
    renderUnderTheme('purple', 'dark');

    expect(screen.getByText('form')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeTruthy();
  });
});
