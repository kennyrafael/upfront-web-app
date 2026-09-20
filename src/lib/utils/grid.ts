/**
 * The steps a day may be divided into, coarsest first.
 *
 * Mirrors `GRID_STEPS` in the API's availability module — the offered times and the rows
 * of the calendar have to agree, or a booking lands between the lines. Duplicated rather
 * than shared because there is no package between these two apps yet; see
 * `docs/ecosystem.md`.
 */
export const GRID_STEPS = [30, 20, 15, 10, 5] as const;

/**
 * The coarsest step that can still represent every one of these minute values.
 *
 * This is what "automatic" means. A shop selling half-hour cuts gets half-hour rows; add
 * a 45-minute colour and the whole calendar moves to quarter hours, because 45 cannot be
 * drawn on a 30 grid. Nobody has to know a grid is a thing they could have configured.
 *
 * Never coarser than 30 and never finer than 5: an hourly grid would halve how many
 * starts a client can pick from, and a five-minute row is already at the limit of what a
 * finger can hit.
 */
export function gridStepFor(minutes: number[]): number {
  const usable = minutes.filter((value) => Number.isFinite(value) && value > 0);
  if (usable.length === 0) return GRID_STEPS[0];

  return GRID_STEPS.find((step) => usable.every((value) => value % step === 0)) ?? 5;
}
