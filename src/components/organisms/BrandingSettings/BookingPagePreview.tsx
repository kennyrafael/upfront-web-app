import { useMemo } from 'react';
import { readableTextOn, tintOf } from '@/lib/utils';

export interface BookingPagePreviewProps {
  businessName: string;
  brandColor: string;
  /** A blob: URL while a file is being chosen, or the saved logo's URL. */
  logoUrl?: string;
}

/**
 * A skeleton of the public booking page, in an iframe.
 *
 * **The iframe is the point, not decoration.** The preview paints with the provider's own
 * colour at full strength, and the dashboard is a carefully balanced green; rendering it
 * inline would leak styles both ways and give a false impression of both. A separate
 * document is the only honest way to show "this is what a stranger sees".
 *
 * It is a skeleton rather than the real page because this has to update on every drag of a
 * colour picker. Mounting the real flow — which fetches services and availability — would
 * mean a request per pixel of movement.
 */
export function BookingPagePreview({ businessName, brandColor, logoUrl }: BookingPagePreviewProps) {
  const document = useMemo(() => {
    const ink = readableTextOn(brandColor);
    const heading = logoUrl
      ? `<img src="${escapeAttribute(logoUrl)}" alt="" />`
      : `<strong>${escapeText(businessName)}</strong>`;

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  body {
    margin: 0; padding: 16px;
    font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #f7faf8; color: #1a2420;
  }
  .bar {
    display: flex; align-items: center; gap: 8px;
    background: ${brandColor}; color: ${ink};
    padding: 10px 14px; border-radius: 10px 10px 0 0;
  }
  .bar img { height: 22px; max-width: 120px; object-fit: contain; display: block }
  .bar strong { font-size: 14px; font-weight: 600 }
  .card {
    background: #fff; border: 1px solid ${tintOf(brandColor, 0.18)};
    border-top: 0; border-radius: 0 0 10px 10px; padding: 14px;
  }
  .muted { color: #6b7a74; font-size: 11px; margin: 0 0 10px }
  .row {
    display: flex; justify-content: space-between; align-items: center;
    border: 1px solid ${tintOf(brandColor, 0.22)}; background: ${tintOf(brandColor, 0.05)};
    border-radius: 8px; padding: 8px 10px; margin-bottom: 6px;
  }
  .slots { display: flex; gap: 6px; margin: 10px 0 12px }
  .slot {
    flex: 1; text-align: center; padding: 6px 0; border-radius: 6px;
    border: 1px solid ${tintOf(brandColor, 0.3)}; font-variant-numeric: tabular-nums;
  }
  .slot.on { background: ${brandColor}; color: ${ink}; border-color: ${brandColor} }
  .cta {
    display: block; width: 100%; text-align: center; padding: 9px 0;
    background: ${brandColor}; color: ${ink};
    border: 0; border-radius: 8px; font-weight: 600; font-size: 13px;
  }
</style></head>
<body>
  <div class="bar">${heading}</div>
  <div class="card">
    <p class="muted">Choose a service</p>
    <div class="row"><span>Corte de cabelo</span><span>22,00 €</span></div>
    <div class="row"><span>Coloração</span><span>65,00 €</span></div>
    <p class="muted">Pick a time</p>
    <div class="slots">
      <div class="slot">09:00</div><div class="slot on">10:15</div><div class="slot">11:30</div>
    </div>
    <button class="cta" type="button">Continue to deposit</button>
  </div>
</body></html>`;
  }, [businessName, brandColor, logoUrl]);

  return (
    <iframe
      title="Booking page preview"
      // No scripts, and nothing of ours reachable from inside it. A preview has no business
      // running anything.
      sandbox=""
      srcDoc={document}
      className="h-[330px] w-full rounded-xl border border-hairline bg-surface"
    />
  );
}

/** The business name is provider-controlled text going into markup. */
function escapeText(value: string): string {
  return value.replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
  );
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}
