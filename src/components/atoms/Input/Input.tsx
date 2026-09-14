import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  invalid?: boolean;
}

const SIZES: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

/** Shared with Textarea and the Select trigger so every field reads as one control. */
export const FIELD_BASE =
  'block w-full rounded-lg bg-white/60 text-ink ring-1 ring-inset transition ' +
  'placeholder:text-ink-muted/60 focus:bg-white focus:outline-none focus:ring-2 ' +
  'disabled:cursor-not-allowed disabled:bg-brand-900/4 disabled:text-ink-muted';

export const FIELD_RING = {
  normal: 'ring-hairline focus:ring-brand-600',
  invalid: 'ring-red-500/60 focus:ring-red-600',
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        FIELD_BASE,
        invalid ? FIELD_RING.invalid : FIELD_RING.normal,
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
