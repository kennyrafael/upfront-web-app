import { useState } from 'react';
import { Badge, Button, Card, Spinner } from '@/components/atoms';
import { ConfirmDialog } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { ServiceItem } from '@/lib/api';
import { formatDuration, formatMoney } from '@/lib/utils';
import { useServiceStore } from '@/stores';

export interface ServiceCatalogTableProps {
  onEdit: (service: ServiceItem) => void;
}

export function ServiceCatalogTable({ onEdit }: ServiceCatalogTableProps) {
  const items = useServiceStore((state) => state.items);
  const status = useServiceStore((state) => state.status);
  const remove = useServiceStore((state) => state.remove);

  const copy = useCopy();
  const [pendingDelete, setPendingDelete] = useState<ServiceItem>();

  if (status === 'loading' && items.length === 0) {
    return (
      <Card className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
        <Spinner className="text-brand-ink" /> {copy.services.loading}
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">{copy.services.emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{copy.services.emptyBody}</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-2xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-medium">{copy.services.columnService}</th>
                <th className="px-5 py-3 font-medium">{copy.common.duration}</th>
                <th className="px-5 py-3 font-medium">{copy.common.price}</th>
                <th className="px-5 py-3 font-medium">{copy.common.status}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-hairline/60 transition-colors last:border-0 hover:bg-brand-700/4"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-brand-900">{service.name}</p>
                    {service.description ? (
                      <p className="mt-0.5 max-w-md text-xs text-ink-muted">
                        {service.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {formatDuration(service.durationMinutes)}
                  </td>
                  <td className="px-5 py-3 font-medium tabular-nums text-brand-900">
                    {formatMoney(service.priceCents, service.currency)}
                  </td>
                  <td className="px-5 py-3">
                    {service.active ? (
                      <Badge variant="brand">{copy.services.bookable}</Badge>
                    ) : (
                      <Badge>{copy.services.archived}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="actions-row flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(service)}>
                        {copy.common.edit}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(service)}>
                        {copy.common.delete}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(undefined)}
        title={copy.services.deleteTitle(pendingDelete?.name ?? copy.services.thisService)}
        description={copy.services.deleteConfirm}
        confirmLabel={copy.common.delete}
        destructive
        loading={status === 'saving'}
        onConfirm={async () => {
          if (pendingDelete && (await remove(pendingDelete.id))) {
            setPendingDelete(undefined);
          }
        }}
      />
    </>
  );
}
