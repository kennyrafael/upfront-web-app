import { useState } from 'react';
import { Badge, Button, Dialog, Icon } from '@/components/atoms';
import { type Invoice, invoicesApi } from '@/lib/api';
import { formatDate, formatMoney, saveBlob } from '@/lib/utils';
import { useProviderStore } from '@/stores';

export interface ReciboPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
}

/**
 * Read-only view of an issued or cancelled recibo, laid out the way the provider will
 * transcribe it into the AT portal. Upfront never files — this is the hand-off.
 */
export function ReciboPreview({ open, onOpenChange, invoice }: ReciboPreviewProps) {
  const profile = useProviderStore((state) => state.profile);
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function downloadPdf() {
    setDownloading(true);
    setFailed(false);
    try {
      const blob = await invoicesApi.pdf(invoice.id);
      saveBlob(blob, `recibo-${invoice.number?.replace(/[^w.-]+/g, '-') ?? 'rascunho'}.pdf`);
    } catch {
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Recibo ${invoice.number ?? '(draft)'}`}
      description="Copy these values into the Portal das Finanças. Upfront does not submit them."
      className="max-w-xl"
      footer={
        <>
          {failed ? (
            <p role="alert" className="mr-auto self-center text-sm text-red-800">
              That PDF could not be produced.
            </p>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button loading={downloading} onClick={downloadPdf}>
            <Icon name="download" className="size-4" />
            Download PDF
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Prestador</p>
            <p className="font-medium text-brand-900">
              {profile?.businessName ?? profile?.name ?? '—'}
            </p>
            {profile?.nif ? (
              <p className="text-sm tabular-nums text-ink-muted">NIF {profile.nif}</p>
            ) : (
              <p className="text-sm text-amber-800">No NIF on file — add one in Settings.</p>
            )}
          </div>
          <Badge variant={invoice.status === 'cancelled' ? 'danger' : 'brand'}>
            {invoice.status === 'cancelled' ? 'Cancelled' : 'Issued'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-hairline py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Adquirente</p>
            <p className="text-brand-900">{invoice.client.name}</p>
            {invoice.client.email ? (
              <p className="text-sm text-ink-muted">{invoice.client.email}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">Data de emissão</p>
            <p className="text-brand-900">{formatDate(invoice.issueDate)}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="pb-2 font-medium">Serviço</th>
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.bookingId} className="border-t border-hairline/70">
                <td className="py-2 text-brand-900">{line.description}</td>
                <td className="py-2 text-ink-muted">{formatDate(line.performedAt)}</td>
                <td className="py-2 text-right tabular-nums text-brand-900">
                  {formatMoney(line.priceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="flex flex-col gap-1 rounded-xl bg-white/50 px-4 py-3 text-sm ring-1 ring-hairline">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Base tributável</dt>
            <dd className="tabular-nums text-brand-900">{formatMoney(invoice.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">IVA ({invoice.vatRate}%)</dt>
            <dd className="tabular-nums text-brand-900">{formatMoney(invoice.vatCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-hairline pt-1 font-medium">
            <dt className="text-brand-900">Total</dt>
            <dd className="tabular-nums text-brand-900">{formatMoney(invoice.totalCents)}</dd>
          </div>
        </dl>

        {invoice.vatExemptionReason ? (
          <p className="text-sm text-ink-muted">
            Isenção: <span className="text-brand-900">{invoice.vatExemptionReason}</span>
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
