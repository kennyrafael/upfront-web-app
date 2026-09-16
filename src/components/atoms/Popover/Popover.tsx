import { Popover as ThemedPopover } from '@radix-ui/themes';
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
 * A popover rather than a dropdown menu: the contents are things to read — the bell feed —
 * not commands to run, and a menu's roving focus would make arrow keys skip past text
 * rather than scroll it.
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
    <ThemedPopover.Root open={open} onOpenChange={onOpenChange}>
      <ThemedPopover.Trigger>{trigger}</ThemedPopover.Trigger>
      <ThemedPopover.Content
        align={align}
        className={cn('w-80 max-w-[calc(100vw-1.5rem)] p-0', className)}
      >
        {children}
      </ThemedPopover.Content>
    </ThemedPopover.Root>
  );
}
