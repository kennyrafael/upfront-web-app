import { TextArea } from '@radix-ui/themes';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<typeof TextArea>, 'size' | 'color'> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, rows = 3, ...props },
  ref,
) {
  return (
    <TextArea
      ref={ref}
      rows={rows}
      size="2"
      color={invalid ? 'red' : undefined}
      aria-invalid={invalid || undefined}
      className={cn('w-full', className)}
      {...props}
    />
  );
});
