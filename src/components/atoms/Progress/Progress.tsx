import * as RadixProgress from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  /** 0–1. Clamped, because a turnover ratio can genuinely exceed its ceiling. */
  value: number;
  label: string;
  /** The fill, which carries meaning here: green, amber or red by how close the ceiling is. */
  barClassName?: string;
  className?: string;
}

export function Progress({ value, label, barClassName, className }: ProgressProps) {
  const percent = Math.min(100, Math.max(0, value * 100));

  return (
    <RadixProgress.Root
      // Rounded for the announcement, precise for the drawing: "1 per cent" is what a
      // screen reader should say, and 0.88 is what the bar should be. The clamp matters
      // too — turnover can genuinely pass its ceiling, and "110 out of 100" is not a
      // sentence worth reading out.
      value={Math.round(percent)}
      aria-label={label}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-brand-900/8', className)}
    >
      <RadixProgress.Indicator
        className={cn('h-full rounded-full transition-transform duration-500', barClassName)}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </RadixProgress.Root>
  );
}
