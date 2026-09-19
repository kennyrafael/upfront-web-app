import { Select as ThemedSelect } from '@radix-ui/themes';
import { forwardRef } from 'react';
import { useCopy } from '@/lib';
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

/**
 * Themes' Select, which is its own styling of the same Radix primitive this used to wrap by
 * hand — the chevron, the popper, the checked item and the scroll buttons all come with it.
 *
 * The option list stays a prop rather than children: every caller here builds it from data,
 * and passing `<Select.Item>` elements around would make that a map at each site.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value,
    onValueChange,
    options,
    placeholder,
    invalid = false,
    disabled,
    required,
    id,
    name,
    className,
    ...props
  },
  ref,
) {
  const copy = useCopy();
  return (
    <ThemedSelect.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <ThemedSelect.Trigger
        ref={ref}
        id={id}
        placeholder={placeholder ?? copy.common.select}
        color={invalid ? 'red' : undefined}
        aria-invalid={invalid || undefined}
        className={cn('w-full', className)}
        {...props}
      />
      <ThemedSelect.Content position="popper">
        {options.map((option) => (
          <ThemedSelect.Item key={option.value} value={option.value}>
            {option.label}
          </ThemedSelect.Item>
        ))}
      </ThemedSelect.Content>
    </ThemedSelect.Root>
  );
});
