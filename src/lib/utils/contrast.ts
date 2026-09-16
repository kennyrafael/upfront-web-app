import type { CSSProperties } from 'react';

/**
 * Readable text for a given background.
 *
 * A provider picking pale yellow would otherwise get white text on it and a booking page
 * nobody can read. Rather than restricting the palette — which is their brand, not ours —
 * the text colour follows the background.
 *
 * Uses WCAG relative luminance: perceived brightness, not the average of the channels.
 * Green looks far brighter than blue at the same numeric value, and averaging gets that
 * exactly wrong.
 */
export function readableTextOn(hex: string): '#ffffff' | '#111111' {
  const { r, g, b } = toRgb(hex);

  // 0.179 is where contrast against black and against white are equal.
  return luminance(r, g, b) > 0.179 ? '#111111' : '#ffffff';
}

/** A tint of the colour, for the quiet surfaces that should not shout. */
export function tintOf(hex: string, alpha: number): string {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * The provider's colour, as an override of Radix Themes' accent scale.
 *
 * Themes paints everything accented from `--accent-1` through `--accent-12`, so redefining
 * those twelve on one element repaints every button, ring and tint inside it. That is the
 * only reason a booking page can wear an arbitrary hex without a second set of components
 * that take a colour prop.
 *
 * The steps are Radix's meanings, not a lightness ramp: 1–2 are page and subtle backgrounds,
 * 3–5 component fills, 6–8 borders, **9 the solid fill an action is painted with**, 10 its
 * hover, 11 low-contrast text and 12 high-contrast text. 9 is the provider's colour exactly;
 * everything else is derived from it.
 *
 * The light steps are mixed toward white in oklab, which keeps a mid-blue from going
 * grey-purple on the way up. The text steps are pinned to a luminance instead, because
 * mixing a pale yellow two thirds into black still leaves a mid olive — and 11 and 12 are
 * read as text on a light ground, so they have to be dark whatever sits at step 9.
 */
export function brandStyle(hex?: string): CSSProperties | undefined {
  if (!isHex(hex)) return undefined;

  const lighter = (amount: number) => `color-mix(in oklab, ${hex} ${amount}%, white)`;

  return {
    '--accent-1': lighter(2),
    '--accent-2': lighter(5),
    '--accent-3': lighter(11),
    '--accent-4': lighter(18),
    '--accent-5': lighter(26),
    '--accent-6': lighter(36),
    '--accent-7': lighter(50),
    '--accent-8': lighter(68),
    '--accent-9': hex,
    '--accent-10': atLuminance(hex, 0.75),
    '--accent-11': atLuminance(hex, 0.18),
    '--accent-12': atLuminance(hex, 0.05),

    // The alpha steps, which Themes uses for its soft fills and borders. Left as the jade
    // defaults they would tint every soft surface the wrong colour.
    '--accent-a1': tintOf(hex, 0.02),
    '--accent-a2': tintOf(hex, 0.05),
    '--accent-a3': tintOf(hex, 0.11),
    '--accent-a4': tintOf(hex, 0.18),
    '--accent-a5': tintOf(hex, 0.26),
    '--accent-a6': tintOf(hex, 0.36),
    '--accent-a7': tintOf(hex, 0.5),
    '--accent-a8': tintOf(hex, 0.68),
    '--accent-a9': tintOf(hex, 0.92),
    '--accent-a10': tintOf(hex, 0.95),
    '--accent-a11': tintOf(hex, 0.98),
    '--accent-a12': tintOf(hex, 1),

    '--accent-surface': tintOf(hex, 0.06),
    '--accent-indicator': hex,
    '--accent-track': hex,
    // What Themes writes on top of step 9. Follows the colour rather than being white, so a
    // pale pick stays readable instead of disappearing.
    '--accent-contrast': readableTextOn(hex),
  } as CSSProperties;
}

export function isHex(value?: string): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * The same hue, darkened until it reaches a given brightness.
 *
 * Found by bisection rather than by a formula because luminance is not linear in the channel
 * values — the gamma curve in `luminance` is the whole reason a simple multiplier misses.
 */
function atLuminance(hex: string, target: number): string {
  const { r, g, b } = toRgb(hex);
  // A ratio rather than an absolute: step 10 asks for "a bit darker than 9", and pinning
  // that to a fixed luminance would make an already-dark colour lighter.
  const wanted = target > 0.5 ? luminance(r, g, b) * target : target;

  let low = 0;
  let high = 1;
  for (let step = 0; step < 16; step += 1) {
    const middle = (low + high) / 2;
    if (luminance(r * middle, g * middle, b * middle) > wanted) high = middle;
    else low = middle;
  }

  const scale = (low + high) / 2;
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(channel * scale)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** WCAG relative luminance, on 0–255 channels. */
function luminance(r: number, g: number, b: number): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function toRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}
