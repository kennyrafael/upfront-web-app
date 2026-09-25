import { ContextMenu as ThemedContextMenu } from '@radix-ui/themes';
import { Fragment, forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface ContextMenuItem {
  /** Stable across renders; also what `onSelect` is given back. */
  id: string;
  label: string;
  /** Red and separated from the rest, for the one that undoes something. */
  destructive?: boolean;
  disabled?: boolean;
}

export interface ContextMenuProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  items: ContextMenuItem[];
  onSelect: (id: string) => void;
  /** What right-clicking opens the menu on. */
  children: ReactNode;
}

/**
 * The menu a right-click opens, in the house vocabulary.
 *
 * Items are data rather than children, like `Select`'s options, because every caller
 * builds them from something — a booking's status decides which of them make sense.
 *
 * **A shortcut, never the only way.** Right-click is invisible, mouse-only and absent on
 * touch, so everything here also has a path through the form the block opens on click.
 *
 * Anything else it is given lands on the trigger, and so on the element inside it. Radix
 * triggers compose by cloning their child, so a component in between that keeps its props
 * to itself breaks the chain silently — the menu simply never opens. That is why the ref
 * and the rest are passed down, and it is what lets a `Tooltip` wrap this and still reach
 * the button.
 */
export const ContextMenu = forwardRef<HTMLElement, ContextMenuProps>(function ContextMenu(
  { items, onSelect, children, ...rest },
  ref,
) {
  return (
    <ThemedContextMenu.Root>
      <ThemedContextMenu.Trigger ref={ref} {...rest}>
        {children}
      </ThemedContextMenu.Trigger>
      <ThemedContextMenu.Content size="1">
        {items.map((item, index) => (
          <Fragment key={item.id}>
            {/* A rule above the first destructive item, so cancelling is not the next
                thing down from marking somebody as arrived. */}
            {item.destructive && index > 0 && !items[index - 1].destructive ? (
              <ThemedContextMenu.Separator />
            ) : null}
            <ThemedContextMenu.Item
              color={item.destructive ? 'red' : undefined}
              disabled={item.disabled}
              // `onSelect` rather than `onClick`: Radix closes the menu and restores focus
              // around it, which a bare click handler skips.
              onSelect={() => onSelect(item.id)}
            >
              {item.label}
            </ThemedContextMenu.Item>
          </Fragment>
        ))}
      </ThemedContextMenu.Content>
    </ThemedContextMenu.Root>
  );
});
