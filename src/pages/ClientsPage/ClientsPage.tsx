import { useEffect, useState } from 'react';
import { Button, ClientFormDialog, ClientTable, DashboardLayout, Input } from '@/components';
import { useCopy } from '@/lib';
import type { ClientRecord } from '@/lib/api';
import { useClientStore } from '@/stores';

export function ClientsPage() {
  const copy = useCopy();
  const load = useClientStore((state) => state.load);
  const search = useClientStore((state) => state.search);
  const setSearch = useClientStore((state) => state.setSearch);
  const error = useClientStore((state) => state.error);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRecord>();

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  return (
    <DashboardLayout
      title={copy.clients.title}
      description={copy.clients.lede}
      actions={<Button onClick={openCreate}>{copy.clients.newClient}</Button>}
    >
      <div className="mb-4 max-w-sm">
        <Input
          type="search"
          placeholder={copy.clients.search}
          aria-label={copy.clients.searchLabel}
          value={search}
          onChange={(event) => void setSearch(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      <ClientTable
        onEdit={(client) => {
          setEditing(client);
          setDialogOpen(true);
        }}
      />

      <ClientFormDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
    </DashboardLayout>
  );
}
