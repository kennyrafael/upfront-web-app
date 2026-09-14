import * as RadixSelect from '@radix-ui/react-select';
import { forwardRef } from 'react';
import { FIELD_BASE, FIELD_RING } from '@/components/atoms/Input';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onValueChange, options, placeholder = 'Select…', invalid = false, className, ...props },
  ref,
) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={props.disabled}>
      <RadixSelect.Trigger
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          FIELD_BASE,
          invalid ? FIELD_RING.invalid : FIELD_RING.normal,
          'flex h-10 items-center justify-between gap-2 px-3 text-left text-sm',
          'data-[placeholder]:text-ink-muted/60',
          className,
        )}
        {...props}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="text-ink-muted">
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
            'rounded-xl bg-white/90 shadow-raised ring-1 ring-hairline backdrop-blur-xl',
          )}
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-lg py-2 pr-8 pl-3 text-sm',
                  'text-ink outline-none data-[highlighted]:bg-brand-700/10 data-[highlighted]:text-brand-900',
                )}
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2.5 text-brand-700">
                  <CheckIcon />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="m3.5 8.5 3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
