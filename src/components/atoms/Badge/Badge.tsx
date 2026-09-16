import { Badge as ThemedBadge } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps
  extends Omit<ComponentPropsWithoutRef<typeof ThemedBadge>, 'color' | 'variant'> {
  variant?: BadgeVariant;
}

/** Upfront's five meanings, in Themes' colour vocabulary. */
const COLORS: Record<BadgeVariant, 'gray' | 'jade' | 'amber' | 'red'> = {
  neutral: 'gray',
  brand: 'jade',
  success: 'jade',
  warning: 'amber',
  danger: 'red',
};

export function Badge({ variant = 'neutral', ...props }: BadgeProps) {
  return <ThemedBadge color={COLORS[variant]} variant="soft" radius="full" {...props} />;
}
