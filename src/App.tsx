import { Theme } from '@radix-ui/themes';
import { AppRoutes } from '@/routes';
import { useThemeStore } from '@/stores';

/**
 * Radix Themes owns the palette now.
 *
 * `jade` is the default accent — the closest of the twenty-six to the pine green Upfront
 * has always used — and a business can swap it for one of five others from the account
 * menu. `sage` for the greys stays put whichever they pick, so neutral surfaces keep a
 * faint warmth rather than turning cold; changing it with the accent would mean six grey
 * scales in the bundle to fix something nobody would notice.
 *
 * The rest of the app never names a colour: it uses the semantic Tailwind tokens in
 * `index.css`, which are defined *from* these. That is the whole reason an accent can be
 * swapped at all — six hundred call sites saying `brand-700` need no opinion about it.
 *
 * `appearance` is driven rather than left to `inherit`, because the light/dark choice is the
 * provider's and lives in their own store — Themes should follow it, not the other way
 * round.
 */
export function App() {
  const theme = useThemeStore((state) => state.theme);
  const accent = useThemeStore((state) => state.accent);

  return (
    <Theme
      accentColor={accent}
      grayColor="sage"
      radius="large"
      panelBackground="translucent"
      appearance={theme === 'system' ? 'inherit' : theme}
    >
      <AppRoutes />
    </Theme>
  );
}
