import { useState } from 'react';
import { Button, Card, Spinner } from '@/components/atoms';
import { ConfirmDialog } from '@/components/molecules';
import type { ClientRecord } from '@/lib/api';
import { useClientStore } from '@/stores';

export interface ClientTableProps {
  onEdit: (client: ClientRecord) => void;
}

export function ClientTable({ onEdit }: ClientTableProps) {
  const items = useClientStore((state) => state.items);
  const search = useClientStore((state) => state.search);
  const status = useClientStore((state) => state.status);
  const remove = useClientStore((state) => state.remove);

  const [pendingDelete, setPendingDelete] = useState<ClientRecord>();
  const [deleteError, setDeleteError] = useState<string>();

  if (status === 'loading' && items.length === 0) {
    return (
      <Card className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-ink-muted">
        <Spinner className="text-brand-ink" /> Loading clients…
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="px-5 py-12 text-center">
        <p className="font-medium text-brand-900">
          {search ? 'No clients match that search' : 'No clients yet'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          {search
            ? 'Try a name, phone number or email.'
            : 'Add the people you book. A name is enough to start.'}
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
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-hairline/60 transition-colors last:border-0 hover:bg-brand-700/4"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-brand-900">{client.name}</p>
                    {client.notes ? (
                      <p className="mt-0.5 max-w-md text-xs text-ink-muted">{client.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-ink-muted">{client.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{client.email ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="actions-row flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteError(undefined);
                          setPendingDelete(client);
                        }}
                      >
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
        title={`Delete ${pendingDelete?.name ?? 'client'}?`}
        // The API refuses while bookings reference the client, and says how many.
        description={
          deleteError ??
          'This removes the client permanently. Clients with bookings cannot be deleted.'
        }
        confirmLabel="Delete"
        destructive
        loading={status === 'saving'}
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (await remove(pendingDelete.id)) {
            setPendingDelete(undefined);
          } else {
            setDeleteError(useClientStore.getState().error ?? undefined);
          }
        }}
      />
    </>
  );
}
