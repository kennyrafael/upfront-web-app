import { describe, expect, it } from 'vitest';
import { exportPeriodOptions, exportPeriodValue, parseExportPeriod } from './exportPeriod';

/**
 * These are three lines of code and they shipped a silent bug, which is the argument for the
 * file: `exportPeriodValue` returned a bare `'q'` because both interpolations were lost in an
 * edit. Nothing threw. The quarter reached the store and the export really was narrowed — but
 * `'q'` matches no option, so the Select fell back to its placeholder and the period you had
 * just chosen read as unanswered.
 */
describe('what the select is told is selected', () => {
  it('keeps the number, which it once dropped', () => {
    expect(exportPeriodValue(3)).toBe('q3');
    expect(exportPeriodValue(undefined, 9)).toBe('m9');
  });

  it('answers with a value that is actually one of the options', () => {
    // The real regression, stated as the property rather than the string: a value the Select
    // cannot find is indistinguishable from nothing being chosen.
    const offered = new Set(exportPeriodOptions(COPY as never).map((option) => option.value));

    for (let quarter = 1; quarter <= 4; quarter += 1) {
      expect(offered.has(exportPeriodValue(quarter))).toBe(true);
    }
    for (let month = 1; month <= 12; month += 1) {
      expect(offered.has(exportPeriodValue(undefined, month))).toBe(true);
    }
    expect(offered.has(exportPeriodValue())).toBe(true);
  });

  it('calls the whole year "year" rather than an empty string', () => {
    // Empty reads as nothing-chosen to a Select, which shows its placeholder — so the default
    // period looked like an unanswered question instead of the answer it is.
    expect(exportPeriodValue()).toBe('year');
    expect(exportPeriodValue(0, 0)).toBe('year');
  });
});

describe('reading it back', () => {
  it('round-trips every period the control can offer', () => {
    expect(parseExportPeriod(exportPeriodValue(3))).toEqual({ quarter: 3 });
    expect(parseExportPeriod(exportPeriodValue(undefined, 11))).toEqual({ month: 11 });
    expect(parseExportPeriod(exportPeriodValue())).toEqual({});
  });

  it('treats the whole year as no narrowing at all', () => {
    // Not `{ quarter: NaN }`, which is what a looser parse would hand the API.
    expect(parseExportPeriod('year')).toEqual({});
  });
});

/** Only the compliance strings this module touches, typed loosely on purpose. */
const COPY = {
  compliance: {
    wholeYear: 'Ano inteiro',
    quarterLabel: (quarter: number) => `T${quarter}`,
    monthLabel: (month: number) => `M${month}`,
  },
};
