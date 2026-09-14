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

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', invalid = false, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full rounded-lg bg-white text-slate-900 ring-1 ring-inset transition',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        invalid ? 'ring-red-500 focus:ring-red-500' : 'ring-slate-300 focus:ring-brand-600',
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
