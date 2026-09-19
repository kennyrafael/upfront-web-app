import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';
import { en } from './en';
import { INTL_TAGS, type Locale, readLocale, setFormatLocale, storeLocale } from './locale';
import { type Dictionary, pt } from './pt';

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en };

interface LocaleState {
  locale: Locale;
  copy: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleState | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  const copy = DICTIONARIES[locale];

  // During render, before any child formats anything. An effect would run after they had
  // already rendered against the previous locale — see the note in `locale.ts`.
  setFormatLocale(locale);
  document.documentElement.lang = INTL_TAGS[locale];

  const setLocale = useCallback((next: Locale) => {
    setFormatLocale(next);
    storeLocale(next);
    setLocaleState(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, copy, setLocale }}>{children}</LocaleContext.Provider>
  );
}

function useLocaleState(): LocaleState {
  const state = useContext(LocaleContext);
  if (!state) throw new Error('useCopy must be used inside a LocaleProvider');
  return state;
}

/** The strings, for a component that only reads them. */
export function useCopy(): Dictionary {
  return useLocaleState().copy;
}

/** The switch, for the one place that changes the language. */
export function useLocale(): Omit<LocaleState, 'copy'> {
  const { locale, setLocale } = useLocaleState();
  return { locale, setLocale };
}
