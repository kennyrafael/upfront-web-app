import { TextField } from '@radix-ui/themes';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Built on Themes' own prop type rather than on `InputHTMLAttributes`.
 *
 * Themes narrows a few of the native props — `size` and `color` mean its own scales — so
 * deriving from it is what keeps a caller from passing something the component will not
 * accept and only finding out at runtime.
 */
export interface InputProps
  extends Omit<ComponentPropsWithoutRef<typeof TextField.Root>, 'size' | 'color'> {
  size?: InputSize;
  invalid?: boolean;
}

const SIZES: Record<InputSize, '1' | '2' | '3'> = { sm: '1', md: '2', lg: '3' };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid = false, className, ...props },
  ref,
) {
  return (
    <TextField.Root
      ref={ref}
      size={SIZES[size]}
      // Themes has no invalid variant; the red tint and the ARIA state are ours, and they
      // have to agree — a field that only looks wrong is no use to a screen reader.
      color={invalid ? 'red' : undefined}
      aria-invalid={invalid || undefined}
      className={cn('w-full', className)}
      {...props}
    />
  );
});
