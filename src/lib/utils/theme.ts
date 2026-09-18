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

/**
 * The accents a business can dress the dashboard in.
 *
 * Six of Radix's twenty-six, not all of them: every one costs a colour scale in the bundle
 * (see `main.tsx`), and a page of near-identical greens is a worse choice than six that are
 * obviously different from across a room. `jade` is first because it is Upfront's own, and
 * the default for anyone who never opens this.
 *
 * **Only the accent moves.** Success stays jade, warning amber, danger red — those are
 * meanings rather than decoration, and a business whose "paid" badge turned orange because
 * they liked orange would have lost something. It does mean picking red or jade makes the
 * accent and one semantic colour look alike, which is a fair trade for letting people
 * choose.
 */
export const ACCENTS = ['jade', 'blue', 'purple', 'red', 'orange', 'yellow'] as const;
export type Accent = (typeof ACCENTS)[number];

export const ACCENT_LABELS: Record<Accent, string> = {
  jade: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
};

const ACCENT_KEY = 'upfront.accent';

export function readAccent(): Accent {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    return ACCENTS.includes(stored as Accent) ? (stored as Accent) : 'jade';
  } catch {
    // Same as readTheme: a private window throws, and a colour is not worth a crash.
    return 'jade';
  }
}

export function storeAccent(accent: Accent): void {
  try {
    localStorage.setItem(ACCENT_KEY, accent);
  } catch {
    // It applies for this session either way.
  }
}
