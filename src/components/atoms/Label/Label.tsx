import * as RadixLabel from '@radix-ui/react-label';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends RadixLabel.LabelProps {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required = false, children, ...props },
  ref,
) {
  return (
    <RadixLabel.Root
      ref={ref}
      className={cn('text-sm font-medium text-brand-900', className)}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-danger-ink">
          *
        </span>
      ) : null}
    </RadixLabel.Root>
  );
});
