import { useId } from 'react';
import { Label, Select, type SelectProps } from '@/components/atoms';
import { FieldMessage } from '@/components/molecules/FieldMessage';
import { cn } from '@/lib/utils';

export interface SelectFieldProps extends SelectProps {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function SelectField({
  label,
  error,
  hint,
  required,
  id,
  containerClassName,
  ...selectProps
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId} required={required}>
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
