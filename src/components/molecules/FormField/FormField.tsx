import { useId } from 'react';
import { Input, type InputProps, Label } from '@/components/atoms';
import { FieldMessage } from '@/components/molecules/FieldMessage';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends InputProps {
  label: string;
  /** Validation message; also flips the input into its invalid style. */
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  id,
  containerClassName,
  ...inputProps
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <Input
        id={fieldId}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={(error ?? hint) ? messageId : undefined}
        {...inputProps}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
