import { useId } from 'react';
import { Label, Textarea, type TextareaProps } from '@/components/atoms';
import { FieldMessage } from '@/components/molecules/FieldMessage';
import { cn } from '@/lib/utils';

export interface TextareaFieldProps extends TextareaProps {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export function TextareaField({
  label,
  error,
  hint,
  required,
  id,
  containerClassName,
  ...textareaProps
}: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      <Textarea
        id={fieldId}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={(error ?? hint) ? messageId : undefined}
        {...textareaProps}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
