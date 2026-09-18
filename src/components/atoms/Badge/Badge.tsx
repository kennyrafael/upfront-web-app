import { Badge as ThemedBadge } from '@radix-ui/themes';
import type { ComponentPropsWithoutRef } from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface BadgeProps
  extends Omit<ComponentPropsWithoutRef<typeof ThemedBadge>, 'color' | 'variant'> {
  variant?: BadgeVariant;
}

/**
 * Upfront's five meanings, in Themes' colour vocabulary.
 *
 * **`brand` names no colour on purpose.** Themes falls back to whatever accent the theme
 * carries, so a badge that means "this is ours" follows the business's chosen colour while
 * the four that mean something specific do not. It said `jade` until accents became
 * choosable, which left the service badges green on a purple dashboard.
 *
 * `success` is jade and stays jade. Green means fine in a way purple does not, and a shop
 * that liked orange should not end up with an orange "paid".
 */
const COLORS: Record<BadgeVariant, 'gray' | 'jade' | 'amber' | 'red' | undefined> = {
  neutral: 'gray',
  brand: undefined,
  success: 'jade',
  warning: 'amber',
  danger: 'red',
};

export function Badge({ variant = 'neutral', ...props }: BadgeProps) {
  return <ThemedBadge color={COLORS[variant]} variant="soft" radius="full" {...props} />;
}
