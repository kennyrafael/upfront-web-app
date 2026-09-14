import * as RadixSwitch from '@radix-ui/react-switch';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type SwitchProps = RadixSwitch.SwitchProps;

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { className, ...props },
  ref,
) {
  return (
    <RadixSwitch.Root
      ref={ref}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors',
        'bg-brand-900/15 data-[state=checked]:bg-brand-700',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        'disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          'block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform',
          'data-[state=checked]:translate-x-[1.375rem]',
        )}
      />
    </RadixSwitch.Root>
  );
});
