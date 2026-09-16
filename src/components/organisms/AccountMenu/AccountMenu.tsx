import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon, Popover } from '@/components/atoms';
import { resetDomainStores, useAuthStore } from '@/stores';

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
