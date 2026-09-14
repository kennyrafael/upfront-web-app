import { cn } from '@/lib/utils';

export interface FieldMessageProps {
  id: string;
  error?: string;
  hint?: string;
}

/** Renders whichever of error/hint applies, so every field family agrees on the shape. */
export function FieldMessage({ id, error, hint }: FieldMessageProps) {
  const message = error ?? hint;
  if (!message) return null;

  return (
    <p
      id={id}
      className={cn('text-xs', error ? 'text-red-700' : 'text-ink-muted')}
      role={error ? 'alert' : undefined}
    >
      {message}
    </p>
  );
}
