import type { Accent } from '@kennycorrea/ui';

/**
 * The theme and accent machinery now lives in `@kennycorrea/ui`.
 *
 * Re-exported here so `import { ACCENTS } from '@/lib/utils'` keeps working across the app, and
 * because the storage keys — `upfront.theme`, `upfront.accent` — are the same browser's
 * preference whichever Upfront app reads them.
 */
export {
  ACCENTS,
  type Accent,
  applyTheme,
  readAccent,
  readTheme,
  storeAccent,
  storeTheme,
  THEMES,
  type Theme,
} from '@kennycorrea/ui';

/**
 * What each accent is called.
 *
 * **Stays in the app, on purpose.** The package holds the accent *list*, which is structure;
 * what a colour is called is words, and words belong to a dictionary. The same rule keeps
 * `UiStrings` in the package down to two entries.
 *
 * ⚠ These are English in a Portuguese-first product, which was true before this moved and is
 * still true. `AccentPicker` uses them as `aria-label` and `title`, so a Portuguese provider
 * hears "Purple". Worth fixing with the rest of `pt.ts`, not here.
 */
export const ACCENT_LABELS: Record<Accent, string> = {
  jade: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
};
