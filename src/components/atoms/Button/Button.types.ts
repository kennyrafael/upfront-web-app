import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
  /** Renders the child element instead of a `button`, e.g. a router `Link`. */
  asChild?: boolean;
  children?: ReactNode;
}
