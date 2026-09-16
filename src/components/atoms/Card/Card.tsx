import { Card as ThemedCard } from '@radix-ui/themes';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lifts the card off the ground — for dialogs and anything that floats. */
  raised?: boolean;
}

/**
 * Radix Themes' Card, with the padding taken off.
 *
 * Themes pads its card for you; Upfront's cards are built from a header and a body with a
 * rule between them, so the padding belongs to those rather than to the card. `p-0` is the
 * whole of the customisation.
 */
export function Card({ raised = false, className, ...props }: CardProps) {
  return (
    <ThemedCard
      size="2"
      variant={raised ? 'classic' : 'surface'}
      className={cn('p-0', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-hairline px-5 py-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-medium text-brand-900', className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}
