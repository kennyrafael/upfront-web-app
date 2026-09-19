import { getFormatLocale } from '../i18n/locale';

const dateCache = new Map<string, Intl.DateTimeFormat>();
const numberCache = new Map<string, Intl.NumberFormat>();

/**
 * An `Intl.DateTimeFormat` for the locale in force, built once per shape.
 *
 * Constructing one of these is not free, and the calendar formats a few hundred cells on
 * every week change — which is why these used to be module constants. They cannot be any
 * more, because the locale moves, so they are cached on the locale instead: same cost after
 * the first call, and switching language simply lands on different keys.
 *
 * `timeZone` is part of the key rather than a special case. The public booking page renders
 * every time in the provider's zone, and two formatters that differ only by zone are two
 * different formatters.
 */
export function dateFormat(
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
): Intl.DateTimeFormat {
  const locale = getFormatLocale();
  const key = `${locale}|${timeZone ?? ''}|${JSON.stringify(options)}`;

  let format = dateCache.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, timeZone ? { ...options, timeZone } : options);
    dateCache.set(key, format);
  }
  return format;
}

/** The same, for numbers and money. */
export function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const locale = getFormatLocale();
  const key = `${locale}|${JSON.stringify(options)}`;

  let format = numberCache.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberCache.set(key, format);
  }
  return format;
}
