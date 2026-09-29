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
import { useCopy } from '@/lib';
import { ApiError, businessesApi } from '@/lib/api';
import { useAuthStore, useBusinessStore } from '@/stores';

/** Mirrors the API's own rule, so an invalid slug is caught before the round trip. */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function PublicBookingSettings() {
  const copy = useCopy();
  const user = useAuthStore((state) => state.user);
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
  const [toggleError, setToggleError] = useState<string>();
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

  /**
   * First enable mints a slug server-side, so the provider never invents a URL.
   *
   * **This used to fail in silence.** There was no `catch`, and it was called as
   * `void toggle(next)` — so the one rejection the API actually issues here escaped as an
   * unhandled promise, `load()` never ran, and the switch snapped back to off with nothing on
   * screen. A control that refuses to stay on and will not say why.
   *
   * Confirming the address is the **only** thing publishing is gated on — not payments, not a
   * NIF, not a service. So the check is made here too, before the request: the web already
   * knows the answer, and asking lets us say it in the provider's own language. API errors are
   * still English, which is the one place this product speaks it.
   */
  async function toggle(next: boolean) {
    setSaved(false);
    setToggleError(undefined);

    if (next && !user?.emailVerified) {
      setToggleError(copy.bookingPage.verifyFirst);
      return;
    }

    if (next && !profile?.slug) {
      setEnabling(true);
      try {
        await businessesApi.enablePublicBooking();
        await load();
      } catch (error) {
        setToggleError(error instanceof ApiError ? error.message : copy.bookingPage.enableFailed);
      } finally {
        setEnabling(false);
      }
      return;
    }

    // `update` swallows its own failure and records the message on the store rather than
    // throwing, so this reads the result instead of catching. The store's message is the
    // server's, which is the one worth showing.
    if (!(await update({ publicBookingEnabled: next }))) {
      setToggleError(useBusinessStore.getState().error ?? copy.bookingPage.enableFailed);
    }
  }

  async function save() {
    if (slug && !SLUG_PATTERN.test(slug)) {
      setSlugError(copy.bookingPage.slugError);
      return;
    }
    setSlugError(undefined);

    const ok = await update({
      slug: slug || undefined,
      bookingLeadTimeHours: Number(leadTime),
      bookingHorizonDays: Number(horizon),
      // Zero on `none`, because the input is hidden there and its state is whatever it held
      // before the mode changed. Sending that stale number is how a percentage comes to be
      // stored against a mode that ignores it — the server refuses the pair, and the provider
      // would see a validation error about a field they cannot see.
      depositPercent: mode === 'none' ? 0 : Number(deposit),
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
          <CardTitle>{copy.bookingPage.title}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{copy.bookingPage.lede}</p>
        </div>
        <Badge variant={enabled ? 'brand' : 'neutral'}>
          {enabled ? copy.bookingPage.live : copy.bookingPage.off}
        </Badge>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
          <div>
            <Label htmlFor="public-booking-enabled">{copy.bookingPage.accept}</Label>
            <p className="text-xs text-ink-muted">{copy.bookingPage.acceptHint}</p>
          </div>
          <Switch
            id="public-booking-enabled"
            checked={enabled}
            disabled={enabling || status === 'saving'}
            onCheckedChange={(next) => void toggle(next)}
          />
        </div>

        {toggleError ? (
          <p className="rounded-lg bg-danger/12 px-3 py-2 text-danger-ink text-sm" role="alert">
            {toggleError}
          </p>
        ) : null}

        {enabled ? (
          <>
            <FormField
              label={copy.bookingPage.address}
              hint={bookingUrl ? copy.bookingPage.addressHint(bookingUrl) : undefined}
              error={slugError}
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value.toLowerCase());
                setSaved(false);
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={copy.bookingPage.minimumNotice}
                inputMode="numeric"
                hint={copy.bookingPage.minimumNoticeHint}
                value={leadTime}
                onChange={(event) => {
                  setLeadTime(event.target.value);
                  setSaved(false);
                }}
              />
              <FormField
                label={copy.bookingPage.horizon}
                inputMode="numeric"
                hint={copy.bookingPage.horizonHint}
                value={horizon}
                onChange={(event) => {
                  setHorizon(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
            <div className="rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
              <SelectField
                label={copy.bookingPage.whatClientsPay}
                options={[
                  { value: 'none', label: copy.bookingPage.payNothing },
                  { value: 'deposit', label: copy.bookingPage.payDeposit },
                  { value: 'full', label: copy.bookingPage.payFull },
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
                  {copy.bookingPage.fullWarning}
                </p>
              ) : null}

              {mode === 'none' ? null : (
                <FormField
                  label={
                    mode === 'full' ? copy.bookingPage.nonRefundablePart : copy.bookingPage.deposit
                  }
                  inputMode="numeric"
                  hint={
                    mode === 'full'
                      ? copy.bookingPage.nonRefundableHint
                      : copy.bookingPage.depositHint
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
                  label={copy.bookingPage.notice}
                  inputMode="numeric"
                  hint={copy.bookingPage.noticeHint}
                  value={notice}
                  onChange={(event) => {
                    setNotice(event.target.value);
                    setSaved(false);
                  }}
                />
              ) : null}

              {/* The mode decides this, not the percentage. Reading the percentage alone
                  described a deposit policy to a business that takes no payment, because the
                  hidden input still held its old value. */}
              <p className="mt-2 text-xs text-ink-muted">
                {mode !== 'none' && Number(deposit) > 0
                  ? copy.bookingPage.depositPolicy
                  : copy.bookingPage.noDepositPolicy}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl bg-sheet/50 px-3 py-3 ring-1 ring-hairline">
              <div>
                <Label htmlFor="auto-confirm">{copy.bookingPage.autoConfirm}</Label>
                <p className="text-xs text-ink-muted">{copy.bookingPage.autoConfirmHint}</p>
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
                {copy.bookingPage.save}
              </Button>
              {bookingUrl ? (
                <Button
                  variant="secondary"
                  onClick={() => void navigator.clipboard?.writeText(bookingUrl)}
                >
                  {copy.bookingPage.copyLink}
                </Button>
              ) : null}
              {saved ? <span className="text-sm text-brand-ink">{copy.settings.saved}</span> : null}
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
