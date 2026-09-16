import { Tooltip as ThemedTooltip } from '@radix-ui/themes';
import type { ReactNode } from 'react';

export interface TooltipProps {
  /** Nothing renders when this is absent, so a caller can switch it off. */
  label?: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * A hover label, in place of the browser's own `title` attribute.
 *
 * `title` looks free but is not: it never appears for keyboard or touch users, it cannot be
 * styled, and screen readers treat it inconsistently enough to be unreliable as a label.
 * This shows on focus as well as hover and wires `aria-describedby`, which is what the
 * collapsed sidebar needs — a rail of unlabelled icons is unusable without it.
 */
export function Tooltip({ label, children, side = 'right' }: TooltipProps) {
  if (!label) return <>{children}</>;

  return (
    <ThemedTooltip content={label} side={side}>
      {children}
    </ThemedTooltip>
  );
}

/**
 * Kept as a no-op wrapper.
 *
 * Themes mounts its own tooltip provider inside `<Theme>`, so there is nothing left to
 * provide — but the layout reads better with the boundary still visible, and removing it
 * would touch a file for no behavioural reason.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
