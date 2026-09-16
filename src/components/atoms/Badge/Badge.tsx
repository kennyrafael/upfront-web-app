import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-brand-900/6 text-ink-muted ring-brand-900/8',
  brand: 'bg-brand-700/10 text-brand-800 ring-brand-700/15',
  success: 'bg-good/12 text-good-ink ring-good/15',
  warning: 'bg-warn/15 text-warn-ink ring-warn/20',
  danger: 'bg-danger/10 text-danger-ink ring-danger/15',
};

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
