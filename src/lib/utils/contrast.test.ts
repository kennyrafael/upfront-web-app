import { describe, expect, it } from 'vitest';
import { brandStyle, isHex, readableTextOn, tintOf } from './contrast';

/**
 * The provider's brand colour, and the promise that their booking page stays readable in it.
 *
 * This is the one place the app hands control of a colour to a customer, so it is also the
 * one place a contrast guarantee can be broken by data rather than by code. A booking page
 * is read by *their* clients — the people least able to report that it went wrong.
 */
describe('choosing text that can be read on a colour', () => {
  it('writes dark on pale and light on dark', () => {
    // The case the helper exists for: a provider picking pale yellow would otherwise get
    // white on it and a page nobody can read.
    expect(readableTextOn('#ffff00')).toBe('#111111');
    expect(readableTextOn('#ffffff')).toBe('#111111');
    expect(readableTextOn('#000000')).toBe('#ffffff');
    expect(readableTextOn('#1a3d2e')).toBe('#ffffff');
  });

  it('judges by perceived brightness, not by the average of the channels', () => {
    // Pure green and pure blue have the same numeric value and nothing like the same
    // brightness — green is about ten times the luminance. Averaging the channels would
    // call them equal and put white on the green, which is the bug this rules out.
    expect(readableTextOn('#00ff00')).toBe('#111111');
    expect(readableTextOn('#0000ff')).toBe('#ffffff');
  });

  it('accepts a six-digit hex in either case, and nothing else', () => {
    // `brandStyle` returns undefined for anything that fails this, so a bad value falls back
    // to the default accent rather than painting the page with `NaN`.
    expect(isHex('#1a3d2e')).toBe(true);
    expect(isHex('#1A3D2E')).toBe(true);

    expect(isHex('#abc')).toBe(false);
    expect(isHex('1a3d2e')).toBe(false);
    expect(isHex('#1a3d2eff')).toBe(false);
    expect(isHex('rebeccapurple')).toBe(false);
    expect(isHex(undefined)).toBe(false);
  });
});

describe('painting Radix Themes with a colour it has never heard of', () => {
  it('declines an invalid hex rather than emitting broken custom properties', () => {
    // Returning a style object full of `rgba(NaN, …)` would not throw anywhere — it would
    // just render an uncoloured page, which reads as "the branding feature is broken".
    expect(brandStyle(undefined)).toBeUndefined();
    expect(brandStyle('not-a-colour')).toBeUndefined();
  });

  it('puts the provider colour at step 9, which is what an action is painted with', () => {
    const style = brandStyle('#1a3d2e') as Record<string, string>;

    expect(style['--accent-9']).toBe('#1a3d2e');
    // Its contrast pair has to follow the colour, or a pale brand loses its button labels.
    expect(style['--accent-contrast']).toBe(readableTextOn('#1a3d2e'));
  });

  it('drives the text steps down toward black even when the brand is nearly white', () => {
    // The reason 11 and 12 are pinned to a luminance rather than mixed toward black: mixing
    // pale yellow two thirds into black still leaves a mid olive, and these two are read as
    // text on a light ground. A regression here is unreadable text, not an ugly colour.
    //
    // Asserted as an ordering rather than against a threshold. `atLuminance` scales all
    // three channels by one factor, so for a single hue the channel sum orders exactly by
    // brightness — and step 11 targets 0.18, which sits within a thousandth of
    // `readableTextOn`'s own 0.179 cutoff. Testing it against that cutoff would be testing
    // which side of a coin toss it landed on, not that the ramp works.
    const style = brandStyle('#ffff00') as Record<string, string>;
    const brightness = (hex: string) =>
      Number.parseInt(hex.slice(1, 3), 16) +
      Number.parseInt(hex.slice(3, 5), 16) +
      Number.parseInt(hex.slice(5, 7), 16);

    expect(brightness(style['--accent-12'])).toBeLessThan(brightness(style['--accent-11']));
    expect(brightness(style['--accent-11'])).toBeLessThan(brightness('#ffff00'));
    // A quarter of the brightest possible yellow is still comfortably dark; the point is
    // that a pale brand does not leave its own text steps pale.
    expect(brightness(style['--accent-11'])).toBeLessThan(brightness('#ffff00') / 2);
  });

  it('defines every step Themes paints with, so none falls back to jade', () => {
    // A missing step does not fail — it inherits the default accent, so one jade button
    // appears in the middle of somebody's purple page.
    const style = brandStyle('#7c3aed') as Record<string, string>;

    for (let step = 1; step <= 12; step += 1) {
      expect(style[`--accent-${step}`], `--accent-${step}`).toBeTruthy();
      expect(style[`--accent-a${step}`], `--accent-a${step}`).toBeTruthy();
    }
  });
});

describe('tinting', () => {
  it('carries the alpha through and keeps the channels', () => {
    expect(tintOf('#1a3d2e', 0.5)).toBe('rgba(26, 61, 46, 0.5)');
  });
});
