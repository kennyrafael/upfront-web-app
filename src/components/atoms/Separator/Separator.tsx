import { Separator as ThemedSeparator } from '@radix-ui/themes';
import { cn } from '@/lib/utils';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  return <ThemedSeparator orientation={orientation} size="4" className={cn(className)} />;
}
