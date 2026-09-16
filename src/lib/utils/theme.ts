export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'upfront.theme';

/**
 * Applies a theme by stamping the root element, or clearing it for "system".
 *
 * Nothing but this function writes the attribute, and nothing but the stylesheet reads it.
 * "System" deliberately stamps *nothing*: the CSS falls through to `prefers-color-scheme`
 * on its own, so following the operating system needs no listener here and keeps working
 * when the user changes it mid-session.
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored as Theme) ? (stored as Theme) : 'system';
  } catch {
    // Private windows and blocked site data both throw. A theme preference is not worth a
    // crash, so the system default stands.
    return 'system';
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // See readTheme. It applies for this session either way.
  }
}
