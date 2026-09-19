import { useEffect, useState } from 'react';
import {
  Button,
  DashboardLayout,
  Label,
  ServiceCatalogTable,
  ServiceFormDialog,
  Switch,
} from '@/components';
import { useCopy } from '@/lib';
import type { ServiceItem } from '@/lib/api';
import { useServiceStore } from '@/stores';

export function ServicesPage() {
  const copy = useCopy();
  const load = useServiceStore((state) => state.load);
  const includeInactive = useServiceStore((state) => state.includeInactive);
  const setIncludeInactive = useServiceStore((state) => state.setIncludeInactive);
  const error = useServiceStore((state) => state.error);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem>();

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(service: ServiceItem) {
    setEditing(service);
    setDialogOpen(true);
  }

  return (
    <DashboardLayout
      title={copy.services.title}
      description={copy.services.lede}
      actions={<Button onClick={openCreate}>{copy.services.newService}</Button>}
    >
      <div className="mb-4 flex items-center gap-3">
        <Switch
          id="include-archived"
          checked={includeInactive}
          onCheckedChange={(checked) => void setIncludeInactive(checked)}
        />
        <Label htmlFor="include-archived" className="font-normal text-ink-muted">
          {copy.services.showArchived}
        </Label>
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
          {error}
        </p>
      ) : null}

      <ServiceCatalogTable onEdit={openEdit} />

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} service={editing} />
    </DashboardLayout>
  );
}
