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
 * The provider's colour, as an override of the whole brand ramp.
 *
 * Tailwind v4 compiles `bg-brand-700` to `var(--color-brand-700)`, so redefining those
 * variables on one element repaints everything inside it — buttons, rings, slot chips —
 * without a second set of components that take a colour prop. That is the only reason the
 * public page can be themed at all without duplicating it.
 *
 * The two halves of the ramp are built differently, on purpose:
 *
 * - **The light steps are mixed toward white** in oklab, which is what keeps a mid-blue from
 *   going grey-purple on its way up. Browsers without `color-mix` ignore those declarations
 *   and fall back to Upfront's green — a plain page, not a broken one.
 * - **The dark steps are pinned to a luminance**, not mixed. Mixing a pale yellow two thirds
 *   into black still leaves a mid olive, and `brand-900` is the body text and the page
 *   backdrop — it has to be dark whatever colour sits at the top of the ramp, or a pale pick
 *   produces a page that cannot be read.
 */
export function brandStyle(hex?: string): CSSProperties | undefined {
  if (!isHex(hex)) return undefined;

  const lighter = (amount: number) => `color-mix(in oklab, ${hex} ${amount}%, white)`;

  return {
    '--color-brand-50': lighter(7),
    '--color-brand-100': lighter(14),
    '--color-brand-200': lighter(26),
    '--color-brand-300': lighter(44),
    '--color-brand-400': lighter(66),
    '--color-brand-500': lighter(84),
    '--color-brand-600': lighter(94),
    // 700 is the primary action colour, and the one the provider actually picked. Nothing
    // is done to it: what they chose is what lands on the button.
    '--color-brand-700': hex,
    '--color-brand-800': atLuminance(hex, 0.14),
    '--color-brand-900': atLuminance(hex, 0.07),
    '--color-brand-950': atLuminance(hex, 0.035),
    '--color-hairline': tintOf(hex, 0.12),
    // What gets written *on* the brand colour. Follows the background rather than being
    // white, so a pale pick stays readable instead of disappearing.
    '--color-oncolor': readableTextOn(hex),
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

  let low = 0;
  let high = 1;
  for (let step = 0; step < 16; step += 1) {
    const middle = (low + high) / 2;
    if (luminance(r * middle, g * middle, b * middle) > target) high = middle;
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
