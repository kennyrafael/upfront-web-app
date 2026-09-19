export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** What `Intl` should be handed. `pt` alone would give a Brazilian month order in places. */
export const INTL_TAGS: Record<Locale, string> = { pt: 'pt-PT', en: 'en-GB' };

export const LOCALE_NAMES: Record<Locale, string> = { pt: 'Português', en: 'English' };

const STORAGE_KEY = 'upfront.locale';

/**
 * **Portuguese unless the provider says otherwise**, and deliberately not read from the
 * browser.
 *
 * The product is sold in Portugal. A salon owner on a laptop that shipped in English is
 * still a Portuguese salon owner, and guessing from `navigator.language` would put the
 * whole app in the wrong language for exactly the people it is for. One click changes it
 * and the click is remembered.
 */
export function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LOCALES.includes(stored as Locale) ? (stored as Locale) : 'pt';
  } catch {
    // Private windows and blocked site data both throw. A language preference is not worth
    // a crash, so the default stands.
    return 'pt';
  }
}

export function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // See readLocale. It applies for this session either way.
  }
}

/**
 * The locale the formatting helpers use, held here rather than passed to each of them.
 *
 * **This is deliberate mutable module state, and it is the right shape for what it is.**
 * `formatMoney`, `formatDate` and the calendar's date headers are called from well over a
 * hundred places, almost none of which have any business knowing about locales. Threading a
 * parameter through all of them to express one fact about the person using the app would be
 * noise at every call site to avoid one variable here.
 *
 * `LocaleProvider` writes it **during render**, not from an effect. An effect runs after
 * its children have already rendered, so the first paint after a language change would
 * format against the previous one — dates in English under Portuguese headings, for one
 * frame, which is exactly the kind of flicker nobody can reproduce on demand.
 */
let formatLocale: string = INTL_TAGS[readLocale()];

export function setFormatLocale(locale: Locale): void {
  formatLocale = INTL_TAGS[locale];
}

export function getFormatLocale(): string {
  return formatLocale;
}
