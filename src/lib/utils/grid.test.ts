import { describe, expect, it } from 'vitest';
import { busyBlocks, GRID_STEPS, gridStepFor } from './grid';

/**
 * The calendar grid, and the appointments drawn on it.
 *
 * **`GRID_STEPS` is duplicated from the API's availability module**, because there is no
 * shared package between the two apps yet. That duplication is the risk this file covers:
 * if the two lists drift, the public page offers a start time the provider's own calendar
 * has no line for, and a booking lands between the rows. Nothing throws when that happens.
 *
 * `api/test/grid-step.test.ts` says the same things about the other copy, deliberately: a
 * test living on only one side would not see the two drift apart.
 */
describe('how finely to rule the day', () => {
  it('stays coarse when everything the shop sells is a half hour', () => {
    // Nobody has to know a grid is a thing they could have configured.
    expect(gridStepFor([30, 60, 90])).toBe(30);
  });

  it('moves to quarter hours the moment a 45-minute service appears', () => {
    // 45 cannot be drawn on a 30 grid, so the whole calendar steps down. This is the worked
    // example in the brief.
    expect(gridStepFor([30, 45])).toBe(15);
  });

  it('never goes coarser than half an hour', () => {
    // An hourly grid halves the starts a client can pick from, so a shop selling only
    // two-hour colours still gets 30-minute rows.
    expect(gridStepFor([60, 120])).toBe(30);
    expect(Math.max(...GRID_STEPS)).toBe(30);
  });

  it('never goes finer than five minutes, whatever the durations demand', () => {
    // Below five a row is smaller than a finger. A 7-minute service cannot be represented
    // exactly, and the answer is the floor rather than a 1-minute grid.
    expect(gridStepFor([7])).toBe(5);
    expect(gridStepFor([13, 29])).toBe(5);
    expect(Math.min(...GRID_STEPS)).toBe(5);
  });

  it('falls back to the coarsest step when there is nothing to go on', () => {
    // A shop with no services yet still has to render a calendar.
    expect(gridStepFor([])).toBe(30);
    expect(gridStepFor([0, Number.NaN, -15])).toBe(30);
  });
});

describe('which stretches of an appointment actually hold somebody', () => {
  it('treats a service with no segments as one solid block', () => {
    // Everything that existed before pauses were added has no segments, and had to keep
    // behaving exactly as it did.
    expect(busyBlocks([{ durationMinutes: 45 }])).toEqual([{ offsetMinutes: 0, minutes: 45 }]);
  });

  it('leaves the chair free during a pause', () => {
    // The 20/35/25 colour from the brief: 20 minutes of work, 35 processing, 25 more. The
    // salon's most valuable half hour is the one in the middle, and treating the whole
    // thing as busy is what used to cost it.
    const blocks = busyBlocks([
      {
        durationMinutes: 80,
        segments: [
          { minutes: 20, busy: true },
          { minutes: 35, busy: false },
          { minutes: 25, busy: true },
        ],
      },
    ]);

    expect(blocks).toEqual([
      { offsetMinutes: 0, minutes: 20 },
      { offsetMinutes: 55, minutes: 25 },
    ]);
  });

  it('merges two ordinary services back to back into one block', () => {
    // Otherwise a haircut followed by a beard trim is drawn with a seam down the middle,
    // which reads as two appointments.
    expect(busyBlocks([{ durationMinutes: 30 }, { durationMinutes: 20 }])).toEqual([
      { offsetMinutes: 0, minutes: 50 },
    ]);
  });

  it('keeps the gap when a pause falls between two services', () => {
    // A basket is one visit, so the second service starts after the first has fully run —
    // including its pause. Getting the cursor wrong here shifts every later block.
    const blocks = busyBlocks([
      {
        durationMinutes: 50,
        segments: [
          { minutes: 15, busy: true },
          { minutes: 20, busy: false },
          { minutes: 15, busy: true },
        ],
      },
      { durationMinutes: 30 },
    ]);

    expect(blocks).toEqual([
      { offsetMinutes: 0, minutes: 15 },
      // 35 through 50 is the second half of the colour; the 30-minute service runs straight
      // on from it, so the two merge into one 45-minute block.
      { offsetMinutes: 35, minutes: 45 },
    ]);
  });

  it('is empty for an appointment that holds nobody at any point', () => {
    // Degenerate, but it must not produce a zero-length block that draws as a hairline.
    expect(busyBlocks([{ durationMinutes: 30, segments: [{ minutes: 30, busy: false }] }])).toEqual(
      [],
    );
  });
});
