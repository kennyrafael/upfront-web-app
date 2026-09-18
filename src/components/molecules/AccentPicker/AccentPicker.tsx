import { ACCENT_LABELS, ACCENTS, type Accent } from '@/lib/utils';

export interface AccentPickerProps {
  value: Accent;
  onChange: (accent: Accent) => void;
}

/**
 * Six swatches for the dashboard accent.
 *
 * Swatches rather than a segmented control with names on it: six labelled segments do not
 * fit the account menu's width, and a colour is recognised faster than it is read. The name
 * is still there for anyone who needs it — as the accessible name, and as a tooltip.
 *
 * **Real radio inputs, painted rather than drawn.** A row of `<button role="radio">` looks
 * identical and behaves worse: same-named radios already give one tab stop for the group,
 * arrow keys that move and select, and the right thing to every screen reader, all from the
 * platform. The only thing wanted from CSS is the colour, and `appearance-none` buys that
 * without giving up the rest.
 *
 * Each swatch is painted with its own scale's step 9 — `var(--jade-9)`, `var(--blue-9)` —
 * so what you see is the colour you get, in whichever appearance you are already looking
 * at. **Every scale named here has to be imported in `main.tsx`**, or the swatch paints
 * with nothing.
 */
export function AccentPicker({ value, onChange }: AccentPickerProps) {
  return (
    <fieldset
      className="flex items-center gap-2 border-0 px-1"
      // The menu around us moves its own focus on the arrow keys, which would fight the
      // radio group for them. Only the arrows: Escape still has to close the menu.
      onKeyDown={(event) => {
        if (event.key.startsWith('Arrow')) event.stopPropagation();
      }}
    >
      <legend className="sr-only">Accent colour</legend>

      {ACCENTS.map((accent) => (
        <input
          key={accent}
          type="radio"
          name="accent"
          value={accent}
          checked={accent === value}
          onChange={() => onChange(accent)}
          aria-label={ACCENT_LABELS[accent]}
          title={ACCENT_LABELS[accent]}
          style={{ backgroundColor: `var(--${accent}-9)` }}
          /* A ring rather than a tick: a checkmark has to be dark on yellow and light on
             purple, and getting that wrong on one swatch is worse than not drawing one. */
          className="size-6 cursor-pointer appearance-none rounded-full outline-none ring-ink ring-offset-2 ring-offset-sheet transition-transform hover:scale-110 checked:ring-2 focus-visible:ring-2"
        />
      ))}
    </fieldset>
  );
}
