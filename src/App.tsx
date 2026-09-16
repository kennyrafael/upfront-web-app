import { Theme } from '@radix-ui/themes';
import { AppRoutes } from '@/routes';
import { useThemeStore } from '@/stores';

/**
 * Radix Themes owns the palette now.
 *
 * `jade` because it is the closest of the twenty-six accents to the pine green Upfront has
 * always used, and `sage` for the greys so the neutral surfaces stay faintly green rather
 * than turning cold next to it. The rest of the app never names a colour: it uses the
 * semantic Tailwind tokens in `index.css`, which are defined *from* these.
 *
 * `appearance` is driven rather than left to `inherit`, because the light/dark choice is the
 * provider's and lives in their own store — Themes should follow it, not the other way
 * round.
 */
export function App() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <Theme
      accentColor="jade"
      grayColor="sage"
      radius="large"
      panelBackground="translucent"
      appearance={theme === 'system' ? 'inherit' : theme}
    >
      <AppRoutes />
    </Theme>
  );
}
