import { Progress as ThemedProgress } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

export interface ProgressProps {
  /** 0–1. Clamped, because a turnover ratio can genuinely exceed its ceiling. */
  value: number;
  label: string;
  /** Carries meaning here: green, amber or red by how close the ceiling is. */
  color?: 'jade' | 'amber' | 'red';
  className?: string;
}

export function Progress({ value, label, color = 'jade', className }: ProgressProps) {
  return (
    <ThemedProgress
      // Rounded for the announcement, clamped for both: turnover can genuinely pass its
      // ceiling, and "110 out of 100" is not a sentence worth reading out.
      value={Math.round(Math.min(100, Math.max(0, value * 100)))}
      max={100}
      color={color}
      size="2"
      aria-label={label}
      className={cn(className)}
    />
  );
}
