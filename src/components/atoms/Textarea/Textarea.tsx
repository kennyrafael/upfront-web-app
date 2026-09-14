import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { FIELD_BASE, FIELD_RING } from '@/components/atoms/Input';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, rows = 3, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        FIELD_BASE,
        invalid ? FIELD_RING.invalid : FIELD_RING.normal,
        'resize-y px-3 py-2 text-sm',
        className,
      )}
      {...props}
    />
  );
});
