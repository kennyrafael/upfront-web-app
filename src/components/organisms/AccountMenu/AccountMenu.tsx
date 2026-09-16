import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Icon, type IconName, Separator } from '@/components/atoms';
import { cn, type Theme } from '@/lib/utils';
import { resetDomainStores, useAuthStore, useThemeStore } from '@/stores';

const THEME_OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'display' },
];

const ITEM_CLASS =
  'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-muted outline-none transition-colors data-[highlighted]:bg-brand-700/8 data-[highlighted]:text-brand-800';

/**
 * A menu rather than a popover full of links.
 *
 * The difference is behaviour, not markup: a menu moves between its items with the arrow
 * keys, jumps to one when you type its first letter, closes on Escape and hands focus back
 * to the trigger. A popover containing anchors does none of that, and every one of them is
 * something a keyboard user expects from a thing that looks like this.
 */
export function AccountMenu() {
  const provider = useAuthStore((state) => state.provider);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <Avatar name={provider?.name} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-64 rounded-xl bg-surface/95 shadow-raised ring-1 ring-hairline backdrop-blur-2xl"
        >
          <DropdownMenu.Label className="border-b border-hairline px-4 py-3">
            <p className="truncate font-medium text-brand-900">{provider?.name}</p>
            <p className="truncate text-xs text-ink-muted">
              {provider?.businessName ?? provider?.email}
            </p>
          </DropdownMenu.Label>

          <div className="p-1.5">
            <DropdownMenu.Item asChild>
              {/* Both land on Settings; the hash is what keeps them from being the same
                  item, taking this one to the business details rather than the page top. */}
              <Link to="/settings#profile" className={ITEM_CLASS}>
                <Icon name="profile" className="size-4" />
                Your profile
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link to="/settings" className={ITEM_CLASS}>
                <Icon name="settings" className="size-4" />
                Settings
              </Link>
            </DropdownMenu.Item>

            <Separator className="my-1.5" />

            {/**
             * Deliberately outside the menu's own keyboard model.
             *
             * Selecting a menu item closes the menu, and a theme is judged by looking at it
             * — being thrown out on every try would mean reopening to compare. The radio
             * group brings its own arrow-key handling, so nothing is lost by stopping the
             * menu from seeing those keys.
             */}
            <div className="px-1 pb-1 pt-0.5">
              <p className="px-1.5 text-xs font-medium text-ink-muted">Appearance</p>
              <RadioGroup.Root
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
                aria-label="Appearance"
                // Held on the group itself, which is the element that owns these keys.
                onKeyDown={(event) => event.stopPropagation()}
                className="mt-1.5 flex gap-1 rounded-lg bg-brand-900/5 p-1"
                loop
              >
                {THEME_OPTIONS.map((option) => (
                  <RadioGroup.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] outline-none transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                      theme === option.value
                        ? 'bg-surface text-brand-900 shadow-sm'
                        : 'text-ink-muted hover:text-brand-800',
                    )}
                  >
                    <Icon name={option.icon} className="size-4" />
                    {option.label}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </div>

            <Separator className="my-1.5" />

            <DropdownMenu.Item
              className={ITEM_CLASS}
              onSelect={() => {
                // Cleared before the request, so a slow sign-out never leaves one account's
                // data on screen under another account's name.
                resetDomainStores();
                void logout();
              }}
            >
              <Icon name="logout" className="size-4" />
              Sign out
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
