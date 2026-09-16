import { Text } from '@radix-ui/themes';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends Omit<ComponentPropsWithoutRef<'label'>, 'color'> {
  required?: boolean;
}

/**
 * Themes' `Text` rendered as a label, so field labels sit on the same type scale as
 * everything else.
 *
 * The asterisk is decoration: `required` is already on the input, and a screen reader
 * announcing "New email star" reads worse than the field simply being required.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, required = false, children, ...props },
  ref,
) {
  return (
    <Text
      as="label"
      size="2"
      weight="medium"
      ref={ref}
      className={cn('text-brand-900', className)}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-0.5 text-danger-ink">
          *
        </span>
      ) : null}
    </Text>
  );
});
