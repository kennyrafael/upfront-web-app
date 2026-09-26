import { useEffect } from 'react';
import { Badge, Card, CardBody, CardHeader, CardTitle, Progress } from '@/components/atoms';
import { useCopy } from '@/lib';
import { useEntitlementsStore } from '@/stores';

/**
 * What a client is told about their appointment, and what is left of the month's SMS.
 *
 * **Read-only, because there is nothing here to set yet.** The channel is chosen per client
 * rather than per shop — email where we have an address, SMS otherwise — and the lead time is
 * a day for everybody. What a provider actually cannot see anywhere else is whether SMS is on
 * their plan at all, and how much of the allowance is spent, which is the one number that
 * silently stops reminders arriving.
 *
 * Renders nothing when the answer has not arrived. A card that says "0 of 0" while loading
 * reads as "you have none", which is worse than a card that is not there yet.
 */
export function RemindersSettings() {
  const copy = useCopy();
  const load = useEntitlementsStore((state) => state.load);
  const entitlements = useEntitlementsStore((state) => state.entitlements);
  const usage = useEntitlementsStore((state) => state.smsUsage);

  useEffect(() => {
    void load();
  }, [load]);

  if (!entitlements) return null;

  const spent = usage && usage.allowance > 0 ? usage.used / usage.allowance : 0;
  // Amber before it matters, red once it does — the point is to be warned, not informed
  // afterwards that reminders stopped a week ago.
  const tone = spent >= 1 ? 'red' : spent >= 0.8 ? 'amber' : 'jade';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.settings.reminders}</CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{copy.settings.remindersLede}</p>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{copy.settings.remindersEmail}</span>
          <Badge variant="success">{copy.settings.remindersAlways}</Badge>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{copy.settings.remindersSms}</span>
            {entitlements.sms ? (
              <Badge variant="brand">{copy.settings.remindersOn}</Badge>
            ) : (
              <Badge variant="neutral">{copy.settings.remindersOffPlan}</Badge>
            )}
          </div>

          {entitlements.sms && usage ? (
            <>
              <Progress
                value={spent}
                color={tone}
                label={copy.settings.remindersUsed(usage.used, usage.allowance)}
              />
              <p className="text-sm text-ink-muted">
                {copy.settings.remindersUsed(usage.used, usage.allowance)}
                {usage.remaining === 0 ? ` ${copy.settings.remindersSpent}` : ''}
              </p>
            </>
          ) : null}

          {!entitlements.sms ? (
            <p className="text-sm text-ink-muted">{copy.settings.remindersUpgrade}</p>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
