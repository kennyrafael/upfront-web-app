import { useId } from 'react';
import { Input, type InputProps, Label } from '@/components/atoms';
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
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <Input
        id={fieldId}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={message ? messageId : undefined}
        {...inputProps}
      />
      {message ? (
        <p
          id={messageId}
          className={cn('text-xs', error ? 'text-red-600' : 'text-slate-500')}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
