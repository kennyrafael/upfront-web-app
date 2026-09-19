import { type FormEvent, useEffect, useState } from 'react';
import { Button, Dialog, Icon, Input, Spinner } from '@/components/atoms';
import { ConfirmDialog } from '@/components/molecules';
import { useCopy } from '@/lib';
import type { CategoryItem } from '@/lib/api';
import { useCategoryStore, useServiceStore } from '@/stores';

export interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Add, rename, reorder and delete the headings the catalogue groups under.
 *
 * A dialog rather than a page of its own: categories are a property of the catalogue, and
 * a shop with six of them does not need somewhere to navigate to.
 */
export function CategoryManagerDialog({ open, onOpenChange }: CategoryManagerDialogProps) {
  const copy = useCopy();
  const items = useCategoryStore((state) => state.items);
  const counts = useCategoryStore((state) => state.counts);
  const status = useCategoryStore((state) => state.status);
  const error = useCategoryStore((state) => state.error);
  const load = useCategoryStore((state) => state.load);
  const create = useCategoryStore((state) => state.create);
  const update = useCategoryStore((state) => state.update);
  const remove = useCategoryStore((state) => state.remove);
  const move = useCategoryStore((state) => state.move);
  const clearError = useCategoryStore((state) => state.clearError);
  // Deleting a heading ungroups its services, so the list behind this has to be refetched.
  const loadServices = useServiceStore((state) => state.load);

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string }>();
  const [pendingDelete, setPendingDelete] = useState<CategoryItem>();

  useEffect(() => {
    if (open) {
      clearError();
      void load();
    }
  }, [open, load, clearError]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (name.length < 2) return;
    if (await create({ name })) setNewName('');
  }

  async function handleRename() {
    if (!editing) return;
    const name = editing.name.trim();
    const unchanged = name === items.find((item) => item.id === editing.id)?.name;

    if (name.length < 2 || unchanged) {
      setEditing(undefined);
      return;
    }
    if (await update(editing.id, { name })) setEditing(undefined);
  }

  const busy = status === 'saving';

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={copy.categories.title}
        description={copy.categories.lede}
        footer={
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {copy.common.close}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {status === 'loading' && items.length === 0 ? (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-muted">
              <Spinner className="text-brand-ink" /> {copy.common.loading}
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-hairline/60 rounded-xl ring-1 ring-hairline">
              {items.map((category, index) => (
                <li key={category.id} className="flex items-center gap-2 px-3 py-2">
                  {editing?.id === category.id ? (
                    <Input
                      autoFocus
                      value={editing.name}
                      aria-label={copy.categories.renameLabel(category.name)}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                      onBlur={handleRename}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleRename();
                        }
                        if (event.key === 'Escape') setEditing(undefined);
                      }}
                    />
                  ) : (
                    <>
                      <span className="flex-1 truncate font-medium text-brand-900">
                        {category.name}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {copy.categories.serviceCount(counts[category.id] ?? 0)}
                      </span>
                    </>
                  )}

                  <div className="actions-row flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0 || busy}
                      aria-label={copy.categories.moveUp(category.name)}
                      onClick={() => void move(category.id, -1)}
                    >
                      <Icon name="chevron-up" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === items.length - 1 || busy}
                      aria-label={copy.categories.moveDown(category.name)}
                      onClick={() => void move(category.id, 1)}
                    >
                      <Icon name="chevron-down" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => setEditing({ id: category.id, name: category.name })}
                    >
                      {copy.common.edit}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => setPendingDelete(category)}
                    >
                      {copy.common.delete}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-sheet/50 px-3 py-6 text-center text-sm text-ink-muted">
              {copy.categories.empty}
            </p>
          )}

          <form className="flex items-end gap-2" onSubmit={handleCreate}>
            <Input
              className="flex-1"
              placeholder={copy.categories.namePlaceholder}
              aria-label={copy.categories.newCategory}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <Button type="submit" loading={busy} disabled={newName.trim().length < 2}>
              {copy.common.add}
            </Button>
          </form>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
              {error}
            </p>
          ) : null}
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => !next && setPendingDelete(undefined)}
        title={copy.categories.deleteTitle(pendingDelete?.name ?? '')}
        // Says what will happen to the services rather than asking "are you sure": a
        // category holds nothing, so the only consequence worth naming is the ungrouping.
        description={copy.categories.deleteConfirm(
          pendingDelete ? (counts[pendingDelete.id] ?? 0) : 0,
        )}
        confirmLabel={copy.common.delete}
        destructive
        loading={busy}
        onConfirm={async () => {
          if (pendingDelete && (await remove(pendingDelete.id))) {
            setPendingDelete(undefined);
            await loadServices();
          }
        }}
      />
    </>
  );
}
