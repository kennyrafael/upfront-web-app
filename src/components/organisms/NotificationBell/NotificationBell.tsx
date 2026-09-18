import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Popover, Spinner } from '@/components/atoms';
import { cn, relativeTime } from '@/lib/utils';
import { useAlertStore } from '@/stores';

/**
 * How often the badge asks whether anything happened.
 *
 * A minute, because these arrive while the provider is with a client and are read when
 * they next look up — nobody is watching this refresh. Anything tighter would be a request
 * per provider per few seconds to tell almost all of them "nothing new".
 */
const POLL_MS = 60_000;

export function NotificationBell() {
  const navigate = useNavigate();

  const items = useAlertStore((state) => state.items);
  const unread = useAlertStore((state) => state.unread);
  const loading = useAlertStore((state) => state.loading);
  const refreshCount = useAlertStore((state) => state.refreshCount);
  const load = useAlertStore((state) => state.load);
  const markAllRead = useAlertStore((state) => state.markAllRead);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    void refreshCount();

    // Paused while the tab is in the background: a provider with the dashboard open in a
    // forgotten tab should not poll all day.
    const tick = () => {
      if (document.visibilityState === 'visible') void refreshCount();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refreshCount]);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;

    await load();
    // Opening the menu is the act of reading it.
    if (unread > 0) void markAllRead();
  }

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      className="w-96 p-0"
      trigger={
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative rounded-lg p-2 text-ink-muted transition-colors hover:bg-brand-700/8 hover:text-brand-800"
        >
          <Icon name="bell" className="size-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-oncolor tabular-nums">
              {/* Past nine it stops being a number worth reading precisely. */}
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <p className="font-medium text-brand-900">Notifications</p>
        {items.some((alert) => !alert.readAt) ? (
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            <Icon name="check" className="size-3.5" /> Marked as read
          </span>
        ) : null}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading && items.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-ink-muted">
            <Spinner className="size-4 text-brand-ink" /> Loading…
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-muted">
            Nothing yet. Bookings, cancellations and deposits show up here.
          </p>
        ) : (
          <ul>
            {items.map((alert) => (
              <li key={alert.id}>
                <button
                  type="button"
                  disabled={!alert.bookingId}
                  onClick={() => {
                    setOpen(false);
                    if (alert.bookingId) navigate('/bookings');
                  }}
                  className={cn(
                    'flex w-full gap-3 border-b border-hairline px-4 py-3 text-left last:border-0',
                    alert.bookingId && 'hover:bg-brand-700/5',
                  )}
                >
                  {/* A dot rather than a different background: unread is one bit, and
                      tinting whole rows makes the list look like it has two designs. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      alert.readAt ? 'bg-transparent' : 'bg-brand-600',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-brand-900">{alert.title}</span>
                      <span className="shrink-0 text-xs text-ink-muted">
                        {relativeTime(alert.createdAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-ink-muted">{alert.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Popover>
  );
}
