import * as RadixAlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/atoms';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

/**
 * An alert dialog, not an ordinary one.
 *
 * The distinction is exactly this dialog's job. An alert dialog interrupts: it is announced
 * as `alertdialog`, it puts initial focus on the *safe* choice rather than the destructive
 * one, and it cannot be dismissed by clicking beside it — only by answering. A plain dialog
 * closes on a stray click outside, which for "delete this booking?" is the difference
 * between cancelling and appearing to have cancelled.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className="fixed inset-0 z-40 bg-scrim/35 backdrop-blur-sm" />
        <RadixAlertDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl bg-surface/92 shadow-raised ring-1 ring-hairline backdrop-blur-2xl',
            'focus:outline-none',
          )}
        >
          <div className="border-b border-hairline px-6 py-4">
            <RadixAlertDialog.Title className="font-medium text-brand-900">
              {title}
            </RadixAlertDialog.Title>
          </div>

          <div className="px-6 py-5">
            <RadixAlertDialog.Description className="text-sm text-ink-muted">
              {description}
            </RadixAlertDialog.Description>
          </div>

          <div className="flex justify-end gap-2 border-t border-hairline px-6 py-4">
            <RadixAlertDialog.Cancel asChild>
              <Button variant="secondary" disabled={loading}>
                {cancelLabel}
              </Button>
            </RadixAlertDialog.Cancel>
            {/* Not wrapped in `Action`: that closes the dialog on click, and the caller
                needs it to stay open while the request is in flight. */}
            <Button
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}
