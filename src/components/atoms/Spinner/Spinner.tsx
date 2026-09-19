import { Spinner as ThemedSpinner } from '@radix-ui/themes';
import { useCopy } from '@/lib';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  className?: string;
  label?: string;
}

/**
 * Themes' spinner, wrapped so it still announces itself.
 *
 * Theirs is decoration — three animated bars with no role — which is right when it sits
 * inside a button that already says "Saving". Standing alone, as it does on a loading
 * screen, something has to tell a screen reader that a wait is in progress.
 */
export function Spinner({ className, label }: SpinnerProps) {
  const copy = useCopy();
  return (
    <span
      role="status"
      aria-label={label ?? copy.common.loading}
      className={cn('inline-flex', className)}
    >
      <ThemedSpinner size="2" />
    </span>
  );
}
