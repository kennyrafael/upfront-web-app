import { useId } from 'react';
import { Label, Select, type SelectProps } from '@/components/atoms';
import { FieldMessage } from '@/components/molecules/FieldMessage';
import { cn } from '@/lib/utils';

export interface SelectFieldProps extends SelectProps {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
  /**
   * Keeps the label for screen readers but takes it off the screen.
   *
   * For the case where something above the field already says what it is, and repeating it
   * would read as two headings for one control — while removing it outright would leave the
   * select with no accessible name at all.
   */
  srOnlyLabel?: boolean;
}

export function SelectField({
  label,
  error,
  hint,
  required,
  id,
  containerClassName,
  srOnlyLabel = false,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId} required={required} className={cn(srOnlyLabel && 'sr-only')}>
        {label}
      </Label>
      <Select
        id={fieldId}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={(error ?? hint) ? messageId : undefined}
        {...selectProps}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
