import { Switch as ThemedSwitch } from '@radix-ui/themes';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type SwitchProps = Omit<ComponentPropsWithoutRef<typeof ThemedSwitch>, 'size'>;

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, ...props },
  ref,
) {
  return <ThemedSwitch ref={ref} size="2" className={cn(className)} {...props} />;
});
