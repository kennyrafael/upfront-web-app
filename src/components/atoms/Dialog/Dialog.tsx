import * as RadixDialog from '@radix-ui/react-dialog';
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
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-brand-950/35 backdrop-blur-sm" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
            'max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-white/92 shadow-raised',
            'ring-1 ring-hairline backdrop-blur-2xl focus:outline-none',
            className,
          )}
        >
          <div className="border-b border-hairline px-6 py-4">
            <RadixDialog.Title className="font-medium text-brand-900">{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-sm text-ink-muted">
                {description}
              </RadixDialog.Description>
            ) : null}
          </div>

          <div className="px-6 py-5">{children}</div>

          {footer ? (
            <div className="flex justify-end gap-2 border-t border-hairline px-6 py-4">
              {footer}
            </div>
          ) : null}

          <RadixDialog.Close
            aria-label="Close"
            className={cn(
              'absolute right-4 top-4 rounded-lg p-1 text-ink-muted transition-colors',
              'hover:bg-brand-700/8 hover:text-brand-800 focus-visible:outline focus-visible:outline-2',
              'focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            )}
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
              <path
                d="m4 4 8 8m0-8-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
