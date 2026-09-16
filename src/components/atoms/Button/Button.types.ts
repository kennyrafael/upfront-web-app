import type { Button as ThemedButton } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Derived from Themes' own props rather than from `ButtonHTMLAttributes`.
 *
 * The native attributes carry a legacy `color` — the HTML 4 one — which collides with the
 * `color` Themes uses for its palette. Starting from the component's own props drops it,
 * along with the other natives it does not accept.
 */
export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof ThemedButton>, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Renders the child element instead of a `button`, e.g. a router `Link`. */
  asChild?: boolean;
  children?: ReactNode;
}
