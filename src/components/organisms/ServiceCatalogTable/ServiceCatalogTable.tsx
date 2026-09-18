import { useState } from 'react';
import { Badge, Button, Card, Spinner } from '@/components/atoms';
import { ConfirmDialog } from '@/components/molecules';
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

  const [pendingDelete, setPendingDelete] = useState<ServiceItem>();

  if (status === 'loading' && items.length === 0) {
    return (
      <Card className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
        <Spinner className="text-brand-ink" /> Loading services…
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">No services yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          Add what you offer — name, how long it takes and what it costs. Bookings in Sprint 3 will
          be built from these.
        </p>
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
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
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
                      <Badge variant="brand">Bookable</Badge>
                    ) : (
                      <Badge>Archived</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(service)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(service)}>
                        Delete
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
        title={`Delete ${pendingDelete?.name ?? 'service'}?`}
        description="This removes the service permanently. To keep it on past bookings, archive it instead by switching off “Bookable”."
        confirmLabel="Delete"
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
