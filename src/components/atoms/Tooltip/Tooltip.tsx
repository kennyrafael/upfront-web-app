import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /** What it says. Nothing renders when this is absent, so a caller can switch it off. */
  label?: string;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/**
 * A hover label, in place of the browser's own `title` attribute.
 *
 * `title` looks free but is not: it never appears for keyboard or touch users, it cannot be
 * styled, and screen readers treat it inconsistently enough that it is unreliable as a
 * label. This shows on focus as well as hover, which is what the collapsed sidebar needs —
 * a rail of unlabelled icons is unusable without it.
 */
export function Tooltip({ label, children, side = 'right', className }: TooltipProps) {
  if (!label) return <>{children}</>;

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={8}
          className={cn(
            'z-50 rounded-lg bg-brand-900 px-2.5 py-1.5 text-xs font-medium text-canvas shadow-raised',
            'select-none',
            className,
          )}
        >
          {label}
          <RadixTooltip.Arrow className="fill-brand-900" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/**
 * Wraps the app once.
 *
 * Radix shares one delay timer across every tooltip under a provider: the first takes a
 * moment to appear, and moving straight to a neighbour shows it at once. Without the shared
 * provider each icon in a rail would make you wait again.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={400} skipDelayDuration={300}>
      {children}
    </RadixTooltip.Provider>
  );
}
