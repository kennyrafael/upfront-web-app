import type { useCopy } from '@/lib';

/**
 * The export period as one select, rather than a quarter picker and a month picker that can
 * contradict each other.
 *
 * Encoded into a single string — `year`, `q3`, `m9` — because a Select holds one value and the
 * alternative is two controls with a rule about which one wins.
 *
 * Lifted out of `CompliancePage` so it can be tested without rendering a page that reaches for
 * the component barrel, three stores and the API client. These are pure functions; that is the
 * whole of what makes them worth pinning.
 */

/**
 * `'year'` rather than an empty string: a Select treats empty as nothing-chosen and shows its
 * placeholder, so the default period read as an unanswered question instead of "the whole
 * year", which is what it is.
 */
export function exportPeriodValue(quarter?: number, month?: number): string {
  // Both interpolations were lost in an edit once, and the loss is silent: a bare 'q' matches
  // no option, so the Select falls back to its placeholder and the period you just picked reads
  // as unanswered, while the export really is narrowed. There are tests for it now.
  if (month) return `m${month}`;
  if (quarter) return `q${quarter}`;
  return 'year';
}

export function parseExportPeriod(value: string): { quarter?: number; month?: number } {
  if (value.startsWith('q')) return { quarter: Number(value.slice(1)) };
  if (value.startsWith('m')) return { month: Number(value.slice(1)) };
  return {};
}

export function exportPeriodOptions(
  copy: ReturnType<typeof useCopy>,
): { value: string; label: string }[] {
  return [
    { value: 'year', label: copy.compliance.wholeYear },
    ...[1, 2, 3, 4].map((quarter) => ({
      value: `q${quarter}`,
      label: copy.compliance.quarterLabel(quarter),
    })),
    ...Array.from({ length: 12 }, (_, index) => ({
      value: `m${index + 1}`,
      label: copy.compliance.monthLabel(index + 1),
    })),
  ];
}
