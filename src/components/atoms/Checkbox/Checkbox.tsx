import { Checkbox as ThemedCheckbox } from '@radix-ui/themes';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CheckboxProps = Omit<ComponentPropsWithoutRef<typeof ThemedCheckbox>, 'size'>;

/**
 * A checkbox, for a list where several answers are true at once.
 *
 * Distinct from `Switch`, which is for a single setting that takes effect immediately. This
 * is for choosing from a set — which services somebody performs — where nothing happens
 * until the form is saved.
 */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { className, ...props },
  ref,
) {
  return <ThemedCheckbox ref={ref} size="2" className={cn(className)} {...props} />;
});
