import * as RadixPopover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PopoverProps {
  /** The control that opens it. Rendered as-is, so it keeps its own styling. */
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/**
 * The menus that hang off the top bar.
 *
 * A popover rather than a dropdown menu: the contents are a list of things to read — the
 * bell feed — not a list of commands to run, and a menu's roving focus would make arrow
 * keys skip past text rather than scroll it.
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'end',
  className,
}: PopoverProps) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          sideOffset={8}
          // `collisionPadding` keeps it off the edge on a phone, where an end-aligned menu
          // would otherwise sit flush against the screen.
          collisionPadding={12}
          className={cn(
            'z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl bg-surface/95 shadow-raised',
            'ring-1 ring-hairline backdrop-blur-2xl focus:outline-none',
            className,
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
