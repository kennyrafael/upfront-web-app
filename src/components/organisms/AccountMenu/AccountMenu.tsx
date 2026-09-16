import { DropdownMenu, SegmentedControl } from '@radix-ui/themes';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Icon, type IconName } from '@/components/atoms';
import type { Theme } from '@/lib/utils';
import { resetDomainStores, useAuthStore, useThemeStore } from '@/stores';

const THEME_OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'display' },
];

const ITEM_CLASS = 'flex w-full cursor-pointer items-center gap-3';

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
      <DropdownMenu.Trigger>
        <button
          type="button"
          aria-label="Account"
          className="rounded-full outline-none transition-opacity hover:opacity-80"
        >
          <Avatar name={provider?.name} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" variant="soft" className="w-64">
        <DropdownMenu.Label>
          <div className="py-1">
            <p className="truncate font-medium text-brand-900">{provider?.name}</p>
            <p className="truncate text-xs text-ink-muted">
              {provider?.businessName ?? provider?.email}
            </p>
          </div>
        </DropdownMenu.Label>

        <DropdownMenu.Item asChild>
          {/* Both land on Settings; the hash is what keeps them from being the same item,
              taking this one to the business details rather than the page top. */}
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

        <DropdownMenu.Separator />

        {/**
         * Deliberately outside the menu's own keyboard model.
         *
         * Selecting a menu item closes the menu, and a theme is judged by looking at it —
         * being thrown out on every try would mean reopening to compare. The segmented
         * control brings its own arrow-key handling, so nothing is lost by stopping the
         * menu from seeing those keys.
         */}
        <div className="px-1 py-1.5">
          <p className="mb-1.5 px-1 text-xs font-medium text-ink-muted">Appearance</p>
          <SegmentedControl.Root
            value={theme}
            onValueChange={(value) => setTheme(value as Theme)}
            size="1"
            className="w-full"
            onKeyDown={(event) => event.stopPropagation()}
          >
            {THEME_OPTIONS.map((option) => (
              <SegmentedControl.Item key={option.value} value={option.value}>
                <span className="flex items-center gap-1.5">
                  <Icon name={option.icon} className="size-3.5" />
                  {option.label}
                </span>
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </div>

        <DropdownMenu.Separator />

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
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
