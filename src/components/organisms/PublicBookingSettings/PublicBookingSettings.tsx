import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Label,
  Switch,
} from '@/components/atoms';
import { FormField, SelectField } from '@/components/molecules';
import { businessesApi } from '@/lib/api';
import { useBusinessStore } from '@/stores';

/** Mirrors the API's own rule, so an invalid slug is caught before the round trip. */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function PublicBookingSettings() {
  const profile = useBusinessStore((state) => state.profile);
  const update = useBusinessStore((state) => state.update);
  const load = useBusinessStore((state) => state.load);
  const status = useBusinessStore((state) => state.status);

  const [slug, setSlug] = useState(profile?.slug ?? '');
  const [leadTime, setLeadTime] = useState(String(profile?.bookingLeadTimeHours ?? 2));
  const [horizon, setHorizon] = useState(String(profile?.bookingHorizonDays ?? 60));
  const [deposit, setDeposit] = useState(String(profile?.depositPercent ?? 0));
  const [mode, setMode] = useState(profile?.paymentMode ?? 'deposit');
  const [notice, setNotice] = useState(String(profile?.cancellationNoticeHours ?? 24));
  const [slugError, setSlugError] = useState<string>();
  const [enabling, setEnabling] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSlug(profile?.slug ?? '');
    setLeadTime(String(profile?.bookingLeadTimeHours ?? 2));
    setHorizon(String(profile?.bookingHorizonDays ?? 60));
    setDeposit(String(profile?.depositPercent ?? 0));
    setMode(profile?.paymentMode ?? 'deposit');
    setNotice(String(profile?.cancellationNoticeHours ?? 24));
  }, [profile]);

  const enabled = profile?.publicBookingEnabled ?? false;
  const bookingUrl = slug ? `${window.location.origin}/book/${slug}` : '';

  /** First enable mints a slug server-side, so the provider never invents a URL. */
  async function toggle(next: boolean) {
    setSaved(false);
    if (next && !profile?.slug) {
      setEnabling(true);
      try {
        await businessesApi.enablePublicBooking();
        await load();
      } finally {
        setEnabling(false);
      }
      return;
    }
    await update({ publicBookingEnabled: next });
  }

  async function save() {
    if (slug && !SLUG_PATTERN.test(slug)) {
      setSlugError('Use 3–40 lowercase letters, numbers or hyphens');
      return;
    }
    setSlugError(undefined);

    const ok = await update({
      slug: slug || undefined,
      bookingLeadTimeHours: Number(leadTime),
      bookingHorizonDays: Number(horizon),
      depositPercent: Number(deposit),
      paymentMode: mode,
      cancellationNoticeHours: Number(notice),
    });

    if (ok) {
      setSaved(true);
    } else {
      // The API is the authority on whether an address is free or reserved.
      setSlugError(useBusinessStore.getState().error ?? undefined);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Public booking page</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">
            Let clients book themselves, without calling you.
          </p>
        </div>
        <Badge variant={enabled ? 'brand' : 'neutral'}>{enabled ? 'Live' : 'Off'}</Badge>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
          <div>
            <Label htmlFor="public-booking-enabled">Accept bookings from clients</Label>
            <p className="text-xs text-ink-muted">
              Off by default — your calendar is private until you publish it.
            </p>
          </div>
          <Switch
            id="public-booking-enabled"
            checked={enabled}
            disabled={enabling || status === 'saving'}
            onCheckedChange={(next) => void toggle(next)}
          />
        </div>

        {enabled ? (
          <>
            <FormField
              label="Your booking address"
              hint={bookingUrl ? `Clients visit ${bookingUrl}` : undefined}
              error={slugError}
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value.toLowerCase());
                setSaved(false);
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Minimum notice"
                inputMode="numeric"
                hint="Hours. Stops someone booking you in ten minutes."
                value={leadTime}
                onChange={(event) => {
                  setLeadTime(event.target.value);
                  setSaved(false);
                }}
              />
              <FormField
                label="How far ahead"
                inputMode="numeric"
                hint="Days clients can book into the future."
                value={horizon}
                onChange={(event) => {
                  setHorizon(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
            <div className="rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
              <SelectField
                label="What clients pay when they book"
                options={[
                  { value: 'none', label: 'Nothing — they pay you in person' },
                  { value: 'deposit', label: 'A deposit' },
                  { value: 'full', label: 'The whole price' },
                ]}
                value={mode}
                onValueChange={(value) => {
                  setMode(value as typeof mode);
                  setSaved(false);
                }}
              />

              {mode === 'full' ? (
                /* Said before they switch it on, not discovered after the first complaint.
                   "Never refunded" is a fair rule for a deposit and an indefensible one for
                   a whole service price. */
                <p className="mt-2 rounded-lg bg-warn/12 px-3 py-2 text-sm text-warn-ink">
                  Taking the whole price means refunding most of it when somebody cancels in time.
                  The deposit below is the part you keep — and there is always a small minimum, so a
                  cancellation never leaves you out of pocket.
                </p>
              ) : null}

              {mode === 'none' ? null : (
                <FormField
                  label={mode === 'full' ? 'Non-refundable part' : 'Deposit'}
                  inputMode="numeric"
                  hint={
                    mode === 'full'
                      ? 'Percent of the price you keep if they cancel. The rest goes back.'
                      : 'Percent of the price, taken by MB WAY when a client books. 0 takes none.'
                  }
                  value={deposit}
                  onChange={(event) => {
                    setDeposit(event.target.value);
                    setSaved(false);
                  }}
                />
              )}
              {mode !== 'none' && Number(deposit) > 0 ? (
                <FormField
                  label="Notice to move an appointment"
                  inputMode="numeric"
                  hint="Hours. Inside this, a client can move their booking and the deposit goes with them."
                  value={notice}
                  onChange={(event) => {
                    setNotice(event.target.value);
                    setSaved(false);
                  }}
                />
              ) : null}

              <p className="mt-2 text-xs text-ink-muted">
                {Number(deposit) > 0
                  ? 'Deposits are never refunded. With enough notice a client moves the appointment instead and keeps it; later than that, the slot was lost at your expense and the deposit stays with you. A small minimum applies, so tiny deposits are not eaten by fees.'
                  : 'No deposit means a slot is held on trust — the usual reason for no-shows.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
              <div>
                <Label htmlFor="auto-confirm">Confirm bookings automatically</Label>
                <p className="text-xs text-ink-muted">
                  Off means they arrive as pending for you to approve.
                </p>
              </div>
              <Switch
                id="auto-confirm"
                checked={profile?.autoConfirmPublicBookings ?? false}
                disabled={status === 'saving'}
                onCheckedChange={(next) => void update({ autoConfirmPublicBookings: next })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={save} loading={status === 'saving'}>
                Save booking page
              </Button>
              {bookingUrl ? (
                <Button
                  variant="secondary"
                  onClick={() => void navigator.clipboard?.writeText(bookingUrl)}
                >
                  Copy link
                </Button>
              ) : null}
              {saved ? <span className="text-sm text-brand-ink">Saved.</span> : null}
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
