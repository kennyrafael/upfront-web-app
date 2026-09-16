import { cn } from '@/lib/utils';

/**
 * The handful of icons this app actually uses, drawn inline.
 *
 * No icon library: a dependency for twelve glyphs costs more in bundle and upgrade surface
 * than it saves, and these are all one or two paths. They inherit `currentColor` and size
 * with the text around them, which is what makes them work in a collapsed sidebar and a
 * button alike.
 */
const PATHS = {
  overview: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  services: 'M4 7h16M4 12h16M4 17h10',
  bookings: 'M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z',
  clients:
    'M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 9.5a3 3 0 100-6 3 3 0 000 6zM21 20v-2a4 4 0 00-3-3.87',
  payments: 'M3 7h18v12H3zM3 11h18M7 15h3',
  compliance: 'M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7zM14 3v4h4M9 13h6M9 17h4',
  settings:
    'M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.14.35.4.65.73.85',
  collapse: 'M15 6l-6 6 6 6',
  expand: 'M9 6l6 6-6 6',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  upload: 'M12 16V4M7 9l5-5 5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
} as const;

export type IconName = keyof typeof PATHS;

export interface IconProps {
  name: IconName;
  className?: string;
  /**
   * A label makes it an image with a name; leaving it out makes it decoration.
   *
   * Decoration is the right answer whenever adjacent text already says the same thing —
   * a screen reader announcing "Bookings, Bookings" is worse than saying it once.
   */
  label?: string;
}

export function Icon({ name, className, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-5 shrink-0', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
