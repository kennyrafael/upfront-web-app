import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';
import { Spinner } from '@/components/atoms/Spinner';
import { cn } from '@/lib/utils';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-700 text-oncolor shadow-sm hover:bg-brand-800 focus-visible:outline-brand-700 active:bg-brand-900',
  secondary:
    'bg-surface/70 text-brand-900 ring-1 ring-inset ring-hairline backdrop-blur-sm hover:bg-surface focus-visible:outline-brand-600',
  ghost: 'text-ink-muted hover:bg-brand-700/8 hover:text-brand-800 focus-visible:outline-brand-600',
  danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800 focus-visible:outline-red-700',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    asChild = false,
    className,
    disabled,
    children,
    ...props
  },
  ref,
) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={asChild ? undefined : disabled || loading}
      {...props}
    >
      {/* Slot demands exactly one child, so an asChild button forwards the child
          untouched — a link rendered as a button has nothing to load anyway. */}
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <Spinner /> : null}
          {children}
        </>
      )}
    </Component>
  );
});
