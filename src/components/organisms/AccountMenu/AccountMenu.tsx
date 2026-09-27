import { DropdownMenu, SegmentedControl } from '@radix-ui/themes';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Icon, type IconName } from '@/components/atoms';
import { AccentPicker } from '@/components/molecules';
import { LOCALE_NAMES, LOCALES, type Locale, useCopy, useLocale } from '@/lib';
import type { Theme } from '@/lib/utils';
import { resetDomainStores, useAuthStore, useThemeStore } from '@/stores';

/** Keyed, not labelled: this list is module-level and the language is not. */
const THEME_OPTIONS: { value: Theme; key: 'light' | 'dark' | 'system'; icon: IconName }[] = [
  { value: 'light', key: 'light', icon: 'sun' },
  { value: 'dark', key: 'dark', icon: 'moon' },
  { value: 'system', key: 'system', icon: 'display' },
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
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const accent = useThemeStore((state) => state.accent);
  const setAccent = useThemeStore((state) => state.setAccent);
  const { locale, setLocale } = useLocale();
  const copy = useCopy();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger>
        <button
          type="button"
          aria-label={copy.account.account}
          className="rounded-full outline-none transition-opacity hover:opacity-80"
        >
          <Avatar name={user?.name} />
        </button>
      </DropdownMenu.Trigger>

      {/* A floor rather than a fixed width: Themes puts the menu inside a scroll area, so a
          width its own padding and items then exceed gives a horizontal scrollbar rather
          than a wider menu. */}
      <DropdownMenu.Content align="end" variant="soft" className="min-w-64">
        {/* `mb-1` so whose account this is reads as a heading over the items rather than as the
            first of them — without it the business name sits flush against "Your profile". */}
        <DropdownMenu.Label className="mb-1">
          <div className="py-1">
            <p className="truncate font-medium text-brand-900">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{user?.businessName ?? user?.email}</p>
          </div>
        </DropdownMenu.Label>

        <DropdownMenu.Item asChild>
          {/* Both land on Settings; the hash is what keeps them from being the same item,
              taking this one to the business details rather than the page top. */}
          <Link to="/settings#you" className={ITEM_CLASS}>
            <Icon name="profile" className="size-4" />
            {copy.account.yourProfile}
          </Link>
        </DropdownMenu.Item>
        <DropdownMenu.Item asChild>
          <Link to="/settings" className={ITEM_CLASS}>
            <Icon name="settings" className="size-4" />
            {copy.account.settings}
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
          <p className="mb-1.5 px-1 text-xs font-medium text-ink-muted">
            {copy.account.appearance}
          </p>
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
                  {copy.account[option.key]}
                </span>
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>

          {/* Under light/dark rather than beside it: they are both "how this looks", and
              the accent is the one people change once and never again. */}
          <p className="mt-3 mb-1.5 px-1 text-xs font-medium text-ink-muted">
            {copy.account.colour}
          </p>
          <AccentPicker value={accent} onChange={setAccent} />

          {/* Language sits with appearance rather than in Settings: all three are "how this
              looks to me", they are all per-browser, and none of them is business data. */}
          <p className="mt-3 mb-1.5 px-1 text-xs font-medium text-ink-muted">{copy.locale.label}</p>
          <SegmentedControl.Root
            value={locale}
            onValueChange={(value) => setLocale(value as Locale)}
            size="1"
            className="w-full"
            onKeyDown={(event) => event.stopPropagation()}
          >
            {LOCALES.map((option) => (
              <SegmentedControl.Item key={option} value={option}>
                {LOCALE_NAMES[option]}
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
          {copy.account.signOut}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
