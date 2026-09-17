import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Icon, Label } from '@/components/atoms';
import { ApiError, businessesApi } from '@/lib/api';
import { useBusinessStore } from '@/stores';
import { BookingPagePreview } from './BookingPagePreview';

/** Upfront's own green, and what the page falls back to. */
const DEFAULT_COLOR = '#144e36';

/** A few that carry a booking page well, for providers who would rather not fiddle. */
const SUGGESTIONS = ['#144e36', '#0f5c7a', '#7a2f4e', '#b4551f', '#2d3a8c', '#3f3f46'];

const MAX_LOGO_KB = 200;

export function BrandingSettings() {
  const profile = useBusinessStore((state) => state.profile);
  const update = useBusinessStore((state) => state.update);
  const load = useBusinessStore((state) => state.load);
  const status = useBusinessStore((state) => state.status);

  const fileInput = useRef<HTMLInputElement>(null);
  /** The blob URL on screen, so it can be released when it is replaced. */
  const objectUrl = useRef<string | undefined>(undefined);

  const [color, setColor] = useState(profile?.brandColor ?? DEFAULT_COLOR);
  /** What the preview draws: a data URL from the server, or a just-picked file. */
  const [logo, setLogo] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setColor(profile?.brandColor ?? DEFAULT_COLOR);
  }, [profile?.brandColor]);

  /**
   * The stored logo comes back as a data URL rather than through its public address.
   *
   * That address only exists once the booking page is published, and a provider dressing
   * their page before publishing it would otherwise upload a logo and see nothing.
   */
  useEffect(() => {
    let current = true;
    businessesApi
      .myLogo()
      .then(({ dataUrl }) => {
        if (current) setLogo(dataUrl);
      })
      // A 404 is the ordinary answer for a provider who has not uploaded one.
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);

  // A blob URL pins the file in memory until it is revoked.
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function showLocally(file: File) {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setLogo(objectUrl.current);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Lets the same file be picked again after a failure. Before any await, while the
    // event still has its target.
    event.target.value = '';
    if (!file) return;

    setError(undefined);
    setSaved(false);

    // Checked here as well as on the server, so an oversized file is refused at once
    // rather than after being uploaded.
    if (file.size > MAX_LOGO_KB * 1024) {
      setError(
        `That image is ${Math.round(file.size / 1024)}KB. Please keep it under ${MAX_LOGO_KB}KB.`,
      );
      return;
    }

    const previous = logo;
    showLocally(file);
    setBusy(true);
    try {
      await businessesApi.uploadLogo(file);
      // Reloads the profile so `logoUrl` — the address the public page uses — is current.
      await load();
      setSaved(true);
    } catch (caught) {
      setLogo(previous);
      setError(caught instanceof ApiError ? caught.message : 'That image could not be uploaded.');
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    setBusy(true);
    setError(undefined);
    try {
      await businessesApi.removeLogo();
      setLogo(undefined);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That logo could not be removed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How your booking page looks</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          This is what your clients see — the dashboard stays as it is.
        </p>
      </CardHeader>

      <CardBody className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="brand-color">Accent colour</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value);
                  setSaved(false);
                }}
                className="size-10 cursor-pointer rounded-lg border border-hairline bg-sheet p-1"
              />
              <code className="rounded-lg bg-brand-900/5 px-2 py-1 text-sm tabular-nums text-brand-900">
                {color.toUpperCase()}
              </code>

              <div className="flex gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    aria-label={`Use ${suggestion}`}
                    onClick={() => {
                      setColor(suggestion);
                      setSaved(false);
                    }}
                    style={{ backgroundColor: suggestion }}
                    className="size-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110"
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              {/* Worth saying, because otherwise it reads as the picker ignoring them. */}
              Text on this colour switches between black and white by itself, so it stays readable
              whichever colour you choose.
            </p>
          </div>

          <div>
            <Label>Logo</Label>
            <p className="mt-0.5 text-xs text-ink-muted">
              PNG, JPEG or WebP, up to {MAX_LOGO_KB}KB. Without one we use your business name.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={chooseFile}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                loading={busy}
                onClick={() => fileInput.current?.click()}
              >
                <Icon name="upload" className="size-4" />
                {logo ? 'Replace logo' : 'Upload a logo'}
              </Button>

              {logo ? (
                <Button variant="ghost" size="sm" disabled={busy} onClick={removeLogo}>
                  <Icon name="trash" className="size-4" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-sm text-danger-ink">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <Button
              loading={status === 'saving'}
              onClick={async () => {
                setError(undefined);
                if (await update({ brandColor: color })) setSaved(true);
              }}
            >
              Save appearance
            </Button>
            {saved ? <span className="text-sm text-brand-700">Saved.</span> : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ink-muted">Preview</p>
          <BookingPagePreview
            businessName={profile?.name ?? 'Your business'}
            brandColor={color}
            logoUrl={logo}
          />
        </div>
      </CardBody>
    </Card>
  );
}
