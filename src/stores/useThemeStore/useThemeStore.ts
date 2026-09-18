import { create } from 'zustand';
import {
  type Accent,
  applyTheme,
  readAccent,
  readTheme,
  storeAccent,
  storeTheme,
  type Theme,
} from '@/lib/utils';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

/**
 * The chosen theme, applied the moment the store is created.
 *
 * Applying at creation rather than from an effect in a component is what stops the app
 * painting one theme and then flipping to the other — the store is built before the first
 * render, an effect runs after it.
 *
 * The accent needs no equivalent: it is read here and handed to `<Theme accentColor>`, so
 * the first paint already has it. Nothing stamps the document for it.
 */
export const useThemeStore = create<ThemeState>((set) => {
  const initial = readTheme();
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme) => {
      applyTheme(theme);
      storeTheme(theme);
      set({ theme });
    },
    accent: readAccent(),
    setAccent: (accent) => {
      storeAccent(accent);
      set({ accent });
    },
  };
});
