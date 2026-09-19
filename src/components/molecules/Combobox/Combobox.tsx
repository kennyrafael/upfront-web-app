import { Popover } from '@radix-ui/themes';
import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import { Input, Label, Spinner } from '@/components/atoms';
import { FieldMessage } from '@/components/molecules/FieldMessage';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  /** A second line, for telling two people with the same name apart — a phone, usually. */
  detail?: string;
}

export interface ComboboxProps {
  label: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
  /** The chosen value's id. */
  value?: string;
  /**
   * What to show for the chosen value when it is not among the loaded options — which is the
   * normal case when editing: the booking's client is one of hundreds and was never fetched.
   */
  selectedLabel?: string;
  /** Asked for with whatever has been typed, empty included. The server does the matching. */
  loadOptions: (term: string) => Promise<ComboboxOption[]>;
  onChange: (option: ComboboxOption) => void;
  loadingMessage: string;
  emptyMessage: string;
  disabled?: boolean;
}

/** Long enough that a typist's next key usually arrives first; short enough not to feel slow. */
const DEBOUNCE_MS = 200;

/**
 * A text field that searches, for lists too long to scroll.
 *
 * Built because the booking form's client select fetched every client up front — capped at
 * two hundred, so the two hundred and first could not be booked at all — and because it
 * shared its list with the Clients page, so whatever was last searched there quietly
 * filtered the booking form too. This asks the server each time and holds nothing.
 *
 * **Portaled rather than positioned.** The dialogs scroll their body, and a list positioned
 * absolutely inside a scrolling box is either clipped or extends the scroll so the bottom of
 * it has to be scrolled to. Radix's popover anchors to the input and renders outside both.
 *
 * **Focus never leaves the input.** The list is driven by `aria-activedescendant`, which is
 * the combobox pattern screen readers expect: the field keeps the caret, arrow keys move a
 * highlight, and the reader announces the highlighted option without focus moving to it.
 * Options take their click on `mousedown` with the default prevented, so choosing one does
 * not blur the field first — no timeout guessing how long a click takes.
 *
 * **Only the newest answer counts.** Type "Ana" quickly and three requests go out; if the one
 * for "A" comes back last, it must not replace the results for "Ana". Every request carries a
 * sequence number and a response for an older one is dropped.
 */
export function Combobox({
  label,
  required,
  placeholder,
  error,
  hint,
  value,
  selectedLabel,
  loadOptions,
  onChange,
  loadingMessage,
  emptyMessage,
  disabled,
}: ComboboxProps) {
  const fieldId = useId();
  const listId = `${fieldId}-list`;
  const messageId = `${fieldId}-message`;

  const [open, setOpen] = useState(false);
  /** What is typed. `null` means "not typing", and the field shows the chosen label instead. */
  const [query, setQuery] = useState<string | null>(null);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const sequence = useRef(0);

  /**
   * Held in a ref so the caller's function identity does not matter. Passed as a dependency
   * instead, an inline `loadOptions={(term) => ...}` — the natural way to write it — is a new
   * function every render, and the effect below would fetch in a loop for as long as the
   * list was open.
   */
  const load = useRef(loadOptions);
  load.current = loadOptions;

  const term = query ?? '';

  useEffect(() => {
    if (!open) return;

    const request = ++sequence.current;
    setLoading(true);

    const timer = setTimeout(() => {
      load
        .current(term.trim())
        .then((next) => {
          if (request !== sequence.current) return;
          setOptions(next);
          setActive(0);
        })
        .catch(() => {
          if (request === sequence.current) setOptions([]);
        })
        .finally(() => {
          if (request === sequence.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, term]);

  function choose(option: ComboboxOption) {
    onChange(option);
    setQuery(null);
    setOpen(false);
  }

  function close() {
    // Leaving without choosing puts the field back to what was chosen before, rather than
    // leaving half a name in it that looks selected and is not.
    setQuery(null);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) setOpen(true);
        else setActive((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case 'Enter': {
        const option = open ? options[active] : undefined;
        if (option) {
          // Only swallowed when it chose something; otherwise Enter still submits the form.
          event.preventDefault();
          choose(option);
        }
        break;
      }
      case 'Escape':
        if (open) {
          // Kept from the dialog around us, which would otherwise close entirely.
          event.preventDefault();
          event.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
    }
  }

  const activeId = open && options[active] ? `${listId}-${options[active].value}` : undefined;
  const shown = query ?? selectedLabel ?? '';

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>

      <Popover.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <Popover.Anchor>
          <div>
            <Input
              id={fieldId}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              aria-describedby={(error ?? hint) ? messageId : undefined}
              autoComplete="off"
              required={required}
              invalid={Boolean(error)}
              disabled={disabled}
              placeholder={placeholder}
              value={shown}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
          </div>
        </Popover.Anchor>

        <Popover.Content
          align="start"
          sideOffset={4}
          // The input keeps focus; the list is only ever pointed at.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // Clicking back into the field is not "outside" in any sense a person means.
          onInteractOutside={(event) => {
            if ((event.target as Element | null)?.closest?.(`[id="${fieldId}"]`)) {
              event.preventDefault();
            }
          }}
          className="p-1"
          style={{ width: 'var(--radix-popover-trigger-width)', maxWidth: 'calc(100vw - 1.5rem)' }}
        >
          <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
            {loading && options.length === 0 ? (
              <li className="flex items-center gap-2 px-3 py-2 text-ink-muted text-sm">
                <Spinner className="size-3.5 text-brand-ink" /> {loadingMessage}
              </li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-ink-muted text-sm">{emptyMessage}</li>
            ) : (
              options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${listId}-${option.value}`}
                  role="option"
                  aria-selected={option.value === value}
                  // Not onClick: mousedown with the default prevented keeps focus in the input.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'flex cursor-pointer flex-col rounded-md px-3 py-2 text-sm',
                    index === active && 'bg-brand-700/10',
                    option.value === value && 'font-medium text-brand-ink',
                  )}
                >
                  <span>{option.label}</span>
                  {option.detail ? (
                    <span className="text-ink-muted text-xs tabular-nums">{option.detail}</span>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Popover.Content>
      </Popover.Root>

      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
