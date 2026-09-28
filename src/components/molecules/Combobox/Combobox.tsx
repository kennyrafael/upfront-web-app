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

interface ComboboxBase {
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
  onChange: (option: ComboboxOption) => void;
  emptyMessage: string;
  disabled?: boolean;
  /**
   * Keeps the label for screen readers but takes it off the screen.
   *
   * For the case where something above already says what this is — repeating it reads as two
   * headings for one control, and dropping it leaves the field with no accessible name.
   */
  srOnlyLabel?: boolean;
}

/**
 * Either a list this component filters, or a loader that does its own matching.
 *
 * **Two sources because there are two kinds of list, not as a convenience.** Clients are
 * unbounded and paginated, so only the server can match them and every keystroke is a request.
 * A shop's service catalogue is deliberately unpaginated — bounded by the shop, per the
 * reasoning in CLAUDE.md — so it is already in memory, and asking the server would add a round
 * trip and a debounce to filtering a list of forty things.
 *
 * A union rather than two optional props, so passing both is a type error instead of a question
 * about which one wins.
 */
export type ComboboxProps = ComboboxBase &
  (
    | {
        /** Filtered here, on every keystroke, with no debounce and no loading state. */
        options: ComboboxOption[];
        loadOptions?: never;
        loadingMessage?: never;
      }
    | {
        /** Asked for with whatever has been typed, empty included. The server does the matching. */
        loadOptions: (term: string) => Promise<ComboboxOption[]>;
        options?: never;
        loadingMessage: string;
      }
  );

/**
 * Folded for comparison: case, and the accents Portuguese names carry.
 *
 * Somebody typing `joao` means João, and a filter that disagrees is a filter people stop
 * trusting. Only the local path needs this — what the server matches on is the server's
 * business.
 */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Every word typed has to appear somewhere in the option, in any order.
 *
 * So "corte ana" finds "Ana · Corte" as readily as "ana corte", which is how people type when
 * they half-remember two things about one row.
 */
function matches(option: ComboboxOption, term: string): boolean {
  const haystack = fold(`${option.label} ${option.detail ?? ''}`);
  return fold(term)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
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
  options: staticOptions,
  onChange,
  loadingMessage,
  emptyMessage,
  disabled,
  srOnlyLabel = false,
}: ComboboxProps) {
  const fieldId = useId();
  const listId = `${fieldId}-list`;
  const messageId = `${fieldId}-message`;

  const [open, setOpen] = useState(false);
  /** What is typed. `null` means "not typing", and the field shows the chosen label instead. */
  const [query, setQuery] = useState<string | null>(null);
  const [fetched, setFetched] = useState<ComboboxOption[]>([]);
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

  /**
   * The list to show, from whichever source this instance was given.
   *
   * Derived for a static list rather than held in state: there is nothing to synchronise, and a
   * `useEffect` that copies a filtered prop into state is a render behind on every keystroke.
   */
  const shownOptions = staticOptions ? staticOptions.filter((o) => matches(o, term)) : fetched;

  useEffect(() => {
    // Nothing to fetch, and no debounce to wait out — a local filter should feel instant.
    const fetcher = load.current;
    if (!open || !fetcher) return;

    const request = ++sequence.current;
    setLoading(true);

    const timer = setTimeout(() => {
      fetcher(term.trim())
        .then((next) => {
          if (request !== sequence.current) return;
          setFetched(next);
          setActive(0);
        })
        .catch(() => {
          if (request === sequence.current) setFetched([]);
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
        else setActive((index) => Math.min(index + 1, shownOptions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case 'Enter': {
        const option = open ? shownOptions[boundedActive] : undefined;
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

  // Reset as the local filter narrows: the highlight must not point past the end of a shorter
  // list. The fetching path does this when a response lands; there is no response here.
  const boundedActive = Math.min(active, Math.max(shownOptions.length - 1, 0));
  const activeId =
    open && shownOptions[boundedActive]
      ? `${listId}-${shownOptions[boundedActive].value}`
      : undefined;
  const shown = query ?? selectedLabel ?? '';

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId} required={required} className={cn(srOnlyLabel && 'sr-only')}>
        {label}
      </Label>

      <Popover.Root open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        {/* **Trigger rather than Anchor, and not as a preference.** `Popover.Anchor` renders
            nothing at all in this version of Themes: the label appeared with no field beneath
            it, so the client could not be typed and no booking could be made from the dashboard.
            Confirmed by swapping one for the other and watching the input come back.

            Themes' Trigger already clones its child rather than wrapping it in a button of its
            own, so the markup is the same as before. Opening is still driven by the input's focus
            and click handlers; the Trigger only gives the list something to anchor to. */}
        <Popover.Trigger>
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
              /**
               * **The Trigger anchors the list; it must not also toggle it**, and preventing
               * the default here is what stops it.
               *
               * Radix composes its own `onOpenToggle` onto the Trigger child's click, and its
               * compose helper skips that handler when the event has already had its default
               * prevented. This click bubbles to that child, so one `preventDefault` on the way
               * past suppresses the toggle without the wrapper needing a handler of its own —
               * which would be a click handler on a plain div, and rightly refused by the
               * accessibility lint.
               *
               * Without it a second click on the field — to move the caret, which is an
               * ordinary thing to do mid-search — closed the list, and closing runs `close()`,
               * which puts the query back to null. Typing "cor" then clicking left it empty.
               * A text input has no click default worth keeping; the caret is placed on
               * mousedown.
               */
              onClick={(event) => {
                event.preventDefault();
                setOpen(true);
              }}
              onKeyDown={onKeyDown}
            />
          </div>
        </Popover.Trigger>

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
          <div id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
            {loading && shownOptions.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 text-ink-muted text-sm">
                <Spinner className="size-3.5 text-brand-ink" /> {loadingMessage}
              </div>
            ) : shownOptions.length === 0 ? (
              <div className="px-3 py-2 text-ink-muted text-sm">{emptyMessage}</div>
            ) : (
              shownOptions.map((option, index) => (
                <div
                  key={option.value}
                  id={`${listId}-${option.value}`}
                  role="option"
                  aria-selected={option.value === value}
                  tabIndex={-1}
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
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Root>

      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}
