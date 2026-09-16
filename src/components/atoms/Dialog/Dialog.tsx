import { Dialog as ThemedDialog } from '@radix-ui/themes';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Action row pinned to the bottom of the panel. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Themes' dialog, laid out the way Upfront's are: a titled header, a body, and a rule above
 * the actions.
 *
 * The padding is taken off the content so those three bands can own it — Themes pads the
 * whole panel, which would put the rules inside the padding rather than across it.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  return (
    <ThemedDialog.Root open={open} onOpenChange={onOpenChange}>
      <ThemedDialog.Content className={cn('max-w-lg p-0', className)}>
        <div className="border-b border-hairline px-6 py-4">
          <ThemedDialog.Title className="mb-0 font-medium text-brand-900">
            {title}
          </ThemedDialog.Title>
          {description ? (
            <ThemedDialog.Description className="mb-0 mt-1 text-sm text-ink-muted">
              {description}
            </ThemedDialog.Description>
          ) : null}
        </div>

        <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex justify-end gap-2 border-t border-hairline px-6 py-4">{footer}</div>
        ) : null}
      </ThemedDialog.Content>
    </ThemedDialog.Root>
  );
}
