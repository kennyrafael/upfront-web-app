import { Button as ThemedButton } from '@radix-ui/themes';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

/**
 * Upfront's four intents, expressed in Radix Themes' variant-and-colour vocabulary.
 *
 * The mapping exists so the rest of the app keeps saying `variant="danger"` rather than
 * `variant="solid" color="red"` at sixty call sites — and so that if the house style ever
 * changes its mind about what "secondary" looks like, it changes here.
 */
const VARIANTS: Record<ButtonVariant, { variant: 'solid' | 'soft' | 'ghost'; color?: 'red' }> = {
  primary: { variant: 'solid' },
  secondary: { variant: 'soft' },
  ghost: { variant: 'ghost' },
  danger: { variant: 'solid', color: 'red' },
};

/** Themes sizes are 1–4; ours are the three a form actually needs. */
const SIZES: Record<ButtonSize, '2' | '3' | '4'> = { sm: '2', md: '3', lg: '4' };

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
  const intent = VARIANTS[variant];

  return (
    <ThemedButton
      ref={ref}
      asChild={asChild}
      variant={intent.variant}
      color={intent.color}
      size={SIZES[size]}
      // Themes renders its own spinner and keeps the label's width while it spins, so the
      // button does not jump. It does not disable the button, which is why `disabled` still
      // accounts for it.
      loading={asChild ? undefined : loading}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    >
      {children}
    </ThemedButton>
  );
});
