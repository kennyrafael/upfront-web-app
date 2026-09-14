import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-brand-900/6 text-ink-muted ring-brand-900/8',
  brand: 'bg-brand-700/10 text-brand-800 ring-brand-700/15',
  success: 'bg-emerald-600/12 text-emerald-800 ring-emerald-700/15',
  warning: 'bg-amber-500/15 text-amber-800 ring-amber-600/20',
  danger: 'bg-red-600/10 text-red-800 ring-red-700/15',
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
