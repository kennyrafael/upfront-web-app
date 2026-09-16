import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName, Popover } from '@/components/atoms';
import { cn, type Theme } from '@/lib/utils';
import { resetDomainStores, useAuthStore, useThemeStore } from '@/stores';

const THEME_OPTIONS: { value: Theme; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'display' },
];

/** Two letters from the name, which is all a 32px circle has room for. */
function initialsOf(name?: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  // First and last, not first two: "Ana Silva Pereira" is AP to anyone who knows her.
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function AccountMenu() {
  const provider = useAuthStore((state) => state.provider);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="w-64 p-0"
      trigger={
        <button
          type="button"
          aria-label="Account"
          className="flex size-8 items-center justify-center rounded-full bg-brand-700/12 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-700/20"
        >
          {initialsOf(provider?.name)}
        </button>
      }
    >
      <div className="border-b border-hairline px-4 py-3">
        <p className="truncate font-medium text-brand-900">{provider?.name}</p>
        <p className="truncate text-xs text-ink-muted">
          {provider?.businessName ?? provider?.email}
        </p>
      </div>

      <div className="p-1.5">
        {/* Both land on Settings; the hash is what keeps them from being the same item,
            taking this one to the business details rather than the top of a long page. */}
        <Link
          to="/settings#profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-brand-700/6 hover:text-brand-800"
        >
          <Icon name="profile" className="size-4" />
          Your profile
        </Link>
        <Link
          to="/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-brand-700/6 hover:text-brand-800"
        >
          <Icon name="settings" className="size-4" />
          Settings
        </Link>

        <div className="my-1.5 border-t border-hairline" />

        {/* Applied on click rather than on save: a theme is judged by looking at it, and
            anything between choosing and seeing it makes that judgement harder. */}
        <div className="px-2.5 pb-1 pt-1.5">
          <p className="text-xs font-medium text-ink-muted">Appearance</p>
          {/* Real radios rather than buttons wearing radio roles: the arrow-key behaviour
              a segmented control is expected to have comes free with them. */}
          <fieldset className="mt-1.5 flex gap-1 rounded-lg bg-brand-900/5 p-1">
            <legend className="sr-only">Appearance</legend>
            {THEME_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[11px] transition-colors',
                  'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600',
                  theme === option.value
                    ? 'bg-surface text-brand-900 shadow-sm'
                    : 'text-ink-muted hover:text-brand-800',
                )}
              >
                <input
                  type="radio"
                  name="appearance"
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => setTheme(option.value)}
                  className="sr-only"
                />
                <Icon name={option.icon} className="size-4" />
                {option.label}
              </label>
            ))}
          </fieldset>
        </div>

        <div className="my-1.5 border-t border-hairline" />

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            // Cleared before the request, so a slow sign-out never leaves one account's
            // data on screen under another account's name.
            resetDomainStores();
            void logout();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-brand-700/6 hover:text-brand-800"
        >
          <Icon name="logout" className="size-4" />
          Sign out
        </button>
      </div>
    </Popover>
  );
}
