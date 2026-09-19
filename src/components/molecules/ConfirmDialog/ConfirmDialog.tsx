import { AlertDialog } from '@radix-ui/themes';
import { Button } from '@/components/atoms';
import { useCopy } from '@/lib';

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
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const copy = useCopy();
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="28rem">
        <AlertDialog.Title>{title}</AlertDialog.Title>
        <AlertDialog.Description size="2" color="gray">
          {description}
        </AlertDialog.Description>

        <div className="mt-5 flex justify-end gap-2">
          <AlertDialog.Cancel>
            <Button variant="secondary" disabled={loading}>
              {cancelLabel ?? copy.common.cancel}
            </Button>
          </AlertDialog.Cancel>
          {/* Not wrapped in `Action`: that closes the dialog on click, and the caller needs
              it to stay open while the request is in flight. */}
          <Button
            variant={destructive ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel ?? copy.common.confirm}
          </Button>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
