import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Dialog, Spinner } from '@/components/atoms';
import { FormField, SelectField } from '@/components/molecules';
import { type Booking, bookingsApi, type Invoice } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { useClientStore, useComplianceStore } from '@/stores';

export interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absent when drafting a new recibo. Only drafts reach this dialog. */
  invoice?: Invoice;
}

const DEFAULT_EXEMPTION = 'Artigo 53.º do CIVA';

interface Fields {
  clientId: string;
  issueDate: string;
  vatAmountRate: string;
  vatExemptionReason: string;
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toFields(invoice?: Invoice): Fields {
  return {
    clientId: invoice?.client.id ?? '',
    issueDate: invoice ? invoice.issueDate.slice(0, 10) : todayInputValue(),
    vatAmountRate: String(invoice?.vatRate ?? 0),
    vatExemptionReason: invoice?.vatExemptionReason ?? DEFAULT_EXEMPTION,
  };
}

export function InvoiceFormDialog({ open, onOpenChange, invoice }: InvoiceFormDialogProps) {
  const clients = useClientStore((state) => state.items);
  const loadClients = useClientStore((state) => state.load);

  const billedBookingIds = useComplianceStore((state) => state.billedBookingIds);
  const create = useComplianceStore((state) => state.create);
  const update = useComplianceStore((state) => state.update);
  const status = useComplianceStore((state) => state.status);
  const error = useComplianceStore((state) => state.error);
  const clearError = useComplianceStore((state) => state.clearError);

  const [fields, setFields] = useState<Fields>(() => toFields(invoice));
  const [selected, setSelected] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields | 'bookings', string>>>({});

  useEffect(() => {
    if (open) {
      setFields(toFields(invoice));
      setSelected(invoice?.lines.map((line) => line.bookingId) ?? []);
      setErrors({});
      clearError();
      void loadClients();
    }
  }, [open, invoice, clearError, loadClients]);

  // Bookings are fetched per client, since that is the only set a recibo may draw from.
  useEffect(() => {
    if (!open || !fields.clientId) {
      setBookings([]);
      return;
    }
    let cancelled = false;
    setLoadingBookings(true);
    bookingsApi
      .listByClient(fields.clientId)
      .then((result) => {
        if (!cancelled) setBookings(result.items);
      })
      .finally(() => {
        if (!cancelled) setLoadingBookings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, fields.clientId]);

  const billable = useMemo(() => {
    // A booking already on THIS draft stays selectable; one held by another recibo does not.
    const onThisDraft = new Set(invoice?.lines.map((line) => line.bookingId) ?? []);
    const heldElsewhere = new Set(billedBookingIds.filter((id) => !onThisDraft.has(id)));

    return bookings
      .filter((booking) => booking.status === 'completed')
      .filter((booking) => !heldElsewhere.has(booking.id))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [bookings, billedBookingIds, invoice]);

  const vatRate = Number(fields.vatAmountRate) || 0;
  const subtotalCents = billable
    .filter((booking) => selected.includes(booking.id))
    .reduce((sum, booking) => sum + booking.priceCents, 0);
  const vatCents = Math.round((subtotalCents * vatRate) / 100);

  function setField<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function toggle(bookingId: string) {
    setSelected((current) =>
      current.includes(bookingId)
        ? current.filter((id) => id !== bookingId)
        : [...current, bookingId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<keyof Fields | 'bookings', string>> = {};
    if (!fields.clientId) nextErrors.clientId = 'Pick a client';
    if (selected.length === 0) nextErrors.bookings = 'Pick at least one booking';
    if (Number.isNaN(Number(fields.vatAmountRate))) nextErrors.vatAmountRate = 'Use a number';
    if (vatRate === 0 && !fields.vatExemptionReason.trim()) {
      nextErrors.vatExemptionReason = 'A recibo with no IVA needs a reason';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      clientId: fields.clientId,
      bookingIds: selected,
      issueDate: new Date(`${fields.issueDate}T00:00:00.000Z`).toISOString(),
      vatRate,
      vatExemptionReason: vatRate === 0 ? fields.vatExemptionReason.trim() : undefined,
    };

    const ok = invoice ? await update(invoice.id, payload) : await create(payload);
    if (ok) onOpenChange(false);
  }

  const busy = status === 'saving';

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={invoice ? 'Edit draft recibo' : 'New recibo verde'}
      description="Lines come from completed bookings, so the total always matches the work."
      className="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="invoice-form" loading={busy}>
            {invoice ? 'Save draft' : 'Create draft'}
          </Button>
        </>
      }
    >
      <form id="invoice-form" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Client"
            required
            placeholder="Choose a client"
            options={clients.map((client) => ({ value: client.id, label: client.name }))}
            value={fields.clientId || undefined}
            error={errors.clientId}
            onValueChange={(value) => {
              setField('clientId', value);
              setSelected([]);
            }}
          />
          <FormField
            label="Issue date"
            type="date"
            required
            value={fields.issueDate}
            onChange={(event) => setField('issueDate', event.target.value)}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-brand-900">Bookings to bill</legend>

          {!fields.clientId ? (
            <p className="rounded-lg bg-brand-900/4 px-3 py-3 text-sm text-ink-muted">
              Pick a client to see their completed bookings.
            </p>
          ) : loadingBookings ? (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-ink-muted">
              <Spinner className="size-3 text-brand-700" /> Loading bookings…
            </p>
          ) : billable.length === 0 ? (
            <p className="rounded-lg bg-brand-900/4 px-3 py-3 text-sm text-ink-muted">
              Nothing billable for this client. Bookings appear here once they are marked completed
              and are not already on a recibo.
            </p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-xl bg-white/50 p-2 ring-1 ring-hairline">
              {billable.map((booking) => (
                <li key={booking.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-700/6">
                    <input
                      type="checkbox"
                      className="size-4 accent-brand-700"
                      checked={selected.includes(booking.id)}
                      onChange={() => toggle(booking.id)}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-brand-900">
                      {booking.service.name}
                    </span>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {formatDate(booking.startsAt)}
                    </span>
                    <span className="w-20 shrink-0 text-right text-sm tabular-nums text-brand-900">
                      {formatMoney(booking.priceCents)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {errors.bookings ? (
            <p role="alert" className="text-xs text-red-700">
              {errors.bookings}
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="IVA rate"
            inputMode="decimal"
            hint="Percent. 0 if you are isento."
            error={errors.vatAmountRate}
            value={fields.vatAmountRate}
            onChange={(event) => setField('vatAmountRate', event.target.value)}
          />
          {vatRate === 0 ? (
            <FormField
              label="Exemption reason"
              required
              error={errors.vatExemptionReason}
              value={fields.vatExemptionReason}
              onChange={(event) => setField('vatExemptionReason', event.target.value)}
            />
          ) : null}
        </div>

        <dl className="flex flex-col gap-1 rounded-xl bg-white/50 px-4 py-3 text-sm ring-1 ring-hairline">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular-nums text-brand-900">{formatMoney(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">IVA ({vatRate}%)</dt>
            <dd className="tabular-nums text-brand-900">{formatMoney(vatCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1 font-medium">
            <dt className="text-brand-900">Total</dt>
            <dd className="tabular-nums text-brand-900">{formatMoney(subtotalCents + vatCents)}</dd>
          </div>
        </dl>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-600/8 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
