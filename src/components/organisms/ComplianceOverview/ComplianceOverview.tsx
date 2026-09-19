import { Badge, Card, CardBody, CardHeader, CardTitle, Progress } from '@/components/atoms';
import { useCopy } from '@/lib';
import type { ComplianceSummary } from '@/lib/api';
import { formatDate, formatMoney, formatPercent } from '@/lib/utils';

export interface ComplianceOverviewProps {
  summary: ComplianceSummary;
}

const THRESHOLD_TONE = {
  ok: { bar: 'jade' as const, badge: 'success' as const, key: 'withinExemption' as const },
  warning: { bar: 'amber' as const, badge: 'warning' as const, key: 'approachingCeiling' as const },
  exceeded: { bar: 'red' as const, badge: 'danger' as const, key: 'ceilingExceeded' as const },
};

const DEADLINE_LABELS = {
  iva: 'IVA',
  social_security: 'Segurança Social',
  irs: 'IRS',
};

export function ComplianceOverview({ summary }: ComplianceOverviewProps) {
  const copy = useCopy();
  const tone = THRESHOLD_TONE[summary.threshold.status];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{copy.compliance.ceilingTitle}</CardTitle>
          <Badge variant={tone.badge}>{copy.compliance[tone.key]}</Badge>
        </CardHeader>
        <CardBody>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-brand-900">
              {formatMoney(summary.threshold.usedCents)}
            </span>
            <span className="text-sm text-ink-muted">
              {copy.compliance.issuedOf(formatMoney(summary.threshold.limitCents))} ·{' '}
              {formatPercent(summary.threshold.ratio)}
            </span>
          </div>

          <Progress
            className="mt-3"
            value={summary.threshold.ratio}
            label={copy.compliance.ceilingShare}
            color={tone.bar}
          />

          {summary.draftCents > 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              {formatMoney(summary.draftCents)} sits in drafts and does not count until issued.
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.quarters.map((quarter) => (
              <div
                key={quarter.quarter}
                className="rounded-xl bg-sheet/50 px-3 py-2 ring-1 ring-hairline"
              >
                <p className="text-xs font-medium text-ink-muted">
                  Q{quarter.quarter} · {copy.compliance.quarters[quarter.quarter - 1]}
                </p>
                <p className="mt-0.5 font-medium tabular-nums text-brand-900">
                  {formatMoney(quarter.issuedCents)}
                </p>
                <p className="text-xs text-ink-muted">
                  {quarter.invoiceCount} recibo{quarter.invoiceCount === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{copy.compliance.notYetBilled}</CardTitle>
          </CardHeader>
          <CardBody>
            {summary.unbilled.count === 0 ? (
              <p className="text-sm text-ink-muted">{copy.compliance.allOnRecibos}</p>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums text-brand-900">
                    {summary.unbilled.count}
                  </span>
                  <span className="text-sm text-ink-muted">
                    {copy.compliance.completedBookings(summary.unbilled.count)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {copy.compliance.waitingToInvoice(formatMoney(summary.unbilled.totalCents))}
                </p>
              </>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{copy.compliance.nextDeadlines}</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-col gap-3">
              {summary.deadlines.slice(0, 4).map((deadline) => (
                <li key={`${deadline.kind}-${deadline.dueOn}`} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={deadline.daysUntil <= 14 ? 'warning' : 'neutral'}>
                      {DEADLINE_LABELS[deadline.kind]}
                    </Badge>
                    <span className="text-xs tabular-nums text-ink-muted">
                      {formatDate(deadline.dueOn)} · {deadline.daysUntil}d
                    </span>
                  </div>
                  <p className="text-sm text-brand-900">{deadline.label}</p>
                  <p className="text-xs text-ink-muted">{deadline.detail}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
