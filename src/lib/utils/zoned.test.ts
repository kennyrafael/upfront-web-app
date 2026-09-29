import { describe, expect, it } from 'vitest';
import { zonedDayKey, zonedTime } from './zoned';

/**
 * The public booking page's clock.
 *
 * A client in London choosing "14:00" from a Lisbon provider's calendar must be choosing
 * 14:00 *Lisbon*, or they turn up an hour out. Every failure in this file is of that shape:
 * nothing throws, the page renders, and somebody misses their appointment.
 */
describe('telling the time in the provider’s zone rather than the reader’s', () => {
  it('renders an instant in the named zone, not the browser’s', () => {
    // 13:00 UTC in midsummer is 14:00 in Lisbon and 15:00 in Madrid — the Spain rollout is
    // in the roadmap, so this is not hypothetical.
    const noon = '2026-07-15T13:00:00.000Z';

    expect(zonedTime(noon, 'Europe/Lisbon')).toBe('14:00');
    expect(zonedTime(noon, 'Europe/Madrid')).toBe('15:00');
    expect(zonedTime(noon, 'UTC')).toBe('13:00');
  });

  it('uses a 24-hour clock whatever the locale would prefer', () => {
    // A 12-hour clock on a booking page is an invitation to turn up at the wrong end of the
    // day, which is why `hourCycle` is pinned rather than left to the locale.
    const evening = zonedTime('2026-07-15T19:30:00.000Z', 'Europe/Lisbon');

    expect(evening).toBe('20:30');
    expect(evening).not.toMatch(/[ap]\.?m/i);
  });

  it('follows the zone across its own daylight saving change', () => {
    // Lisbon is UTC+1 in summer and UTC+0 in winter. A fixed offset would be right for half
    // the year, which is the worst kind of wrong.
    expect(zonedTime('2026-07-15T13:00:00.000Z', 'Europe/Lisbon')).toBe('14:00');
    expect(zonedTime('2026-12-15T13:00:00.000Z', 'Europe/Lisbon')).toBe('13:00');
  });
});

describe('which day an instant belongs to', () => {
  it('produces an ISO-ordered key, because it is a map key and not a date anybody reads', () => {
    expect(zonedDayKey('2026-07-15T13:00:00.000Z', 'Europe/Lisbon')).toBe('2026-07-15');
  });

  it('is unambiguous for a day that could be read either way round', () => {
    // The bug `en-CA` exists to prevent: a locale that yields `07/01/2026` would scatter
    // every booking across the wrong days, silently, and only for part of the month.
    const key = zonedDayKey('2026-01-07T12:00:00.000Z', 'Europe/Lisbon');

    expect(key).toBe('2026-01-07');
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('puts a late-night instant on the shop’s day, not on UTC’s', () => {
    // 23:30 in Lisbon in summer is 22:30 UTC, so both agree. An hour later they do not:
    // 00:30 Lisbon is 23:30 UTC the *previous* day. Grouping in UTC would file a late
    // booking under yesterday — the same rule the month view and the waitlist matcher run.
    expect(zonedDayKey('2026-07-15T23:30:00.000Z', 'Europe/Lisbon')).toBe('2026-07-16');
    expect(zonedDayKey('2026-07-15T23:30:00.000Z', 'UTC')).toBe('2026-07-15');
  });

  it('accepts a Date as readily as an ISO string', () => {
    const instant = new Date('2026-07-15T13:00:00.000Z');

    expect(zonedDayKey(instant, 'Europe/Lisbon')).toBe(
      zonedDayKey(instant.toISOString(), 'Europe/Lisbon'),
    );
  });
});
