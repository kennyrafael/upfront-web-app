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
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10.3 21a2 2 0 003.4 0',
  profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1',
  download: 'M12 4v12M7 11l5 5 5-5M4 19v1a1 1 0 001 1h14a1 1 0 001-1v-1',
  check: 'M4 12.5l5 5L20 6.5',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9z',
  moon: 'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z',
  display: 'M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM9 20h6M12 16v4',
  close: 'M6 6l12 12M18 6L6 18',
  // The circle is what makes it read as a control rather than as decoration, which matters
  // where it is the only thing in its column and has no label beside it.
  'close-circle': 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5l5 5M14.5 9.5l-5 5',
  // Up and down as well as left and right: reordering a list and opening an accordion
  // section both point along the axis the content moves in.
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
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
