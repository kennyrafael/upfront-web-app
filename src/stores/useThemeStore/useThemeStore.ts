import { create } from 'zustand';
import { applyTheme, readTheme, storeTheme, type Theme } from '@/lib/utils';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * The chosen theme, applied the moment the store is created.
 *
 * Applying at creation rather than from an effect in a component is what stops the app
 * painting one theme and then flipping to the other — the store is built before the first
 * render, an effect runs after it.
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
  };
});
