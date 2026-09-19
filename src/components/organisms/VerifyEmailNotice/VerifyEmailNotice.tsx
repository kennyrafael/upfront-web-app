import { useState } from 'react';
import { Button } from '@/components/atoms';
import { useCopy } from '@/lib';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores';

/**
 * The nudge an unverified user sees until they confirm their address.
 *
 * Deliberately a notice rather than a wall. Blocking the product on a confirmation email is
 * how you lose someone who was only ever going to try it once — so everything keeps working,
 * and only publishing a booking page is gated. That is the point where strangers start
 * sending money and every notice about it arrives by email.
 */
export function VerifyEmailNotice() {
  const user = useAuthStore((state) => state.user);
  const copy = useCopy();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warn/12 px-4 py-3 ring-1 ring-warn/25">
      <div>
        <p className="text-sm font-medium text-warn-ink">{copy.verifyEmail.confirm}</p>
        <p className="text-xs text-warn-ink/80">{copy.verifyEmail.body(user.email)}</p>
      </div>

      {sent ? (
        <span className="text-xs font-medium text-warn-ink">{copy.verifyEmail.sent}</span>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          loading={sending}
          onClick={async () => {
            setSending(true);
            try {
              await authApi.resendVerification();
              setSent(true);
            } finally {
              setSending(false);
            }
          }}
        >
          {copy.verifyEmail.sendAgain}
        </Button>
      )}
    </div>
  );
}
