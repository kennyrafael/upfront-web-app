import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, DepositWaiting, PublicBookingFlow, PublicLayout, Spinner } from '@/components';
import { useCopy } from '@/lib';
import { formatMoney, zonedDateTime } from '@/lib/utils';
import { usePublicBookingStore } from '@/stores';

export function PublicBookingPage() {
  const t = useCopy();
  const copy = t.publicBooking;
  const { slug = '' } = useParams();
  const navigate = useNavigate();

  const provider = usePublicBookingStore((state) => state.provider);
  const step = usePublicBookingStore((state) => state.step);
  const status = usePublicBookingStore((state) => state.status);
  const error = usePublicBookingStore((state) => state.error);
  const result = usePublicBookingStore((state) => state.result);
  const selectedSlot = usePublicBookingStore((state) => state.selectedSlot);
  const clientPhone = usePublicBookingStore((state) => state.clientPhone);
  const loadProvider = usePublicBookingStore((state) => state.loadProvider);
  const reset = usePublicBookingStore((state) => state.reset);

  useEffect(() => {
    void loadProvider(slug);
    return reset;
  }, [slug, loadProvider, reset]);

  /**
   * Moves a visitor who arrived on an address the provider used to have.
   *
   * The API still answers on old addresses so a link printed on a card keeps working; this
   * is the other half — putting the current address in the visitor's bar, so what they
   * bookmark or forward is the one that will outlive the next rename.
   *
   * `replace` rather than a push, so Back goes where they came from rather than bouncing
   * them through the redirect again.
   */
  useEffect(() => {
    if (provider && provider.slug !== slug) {
      navigate(`/book/${provider.slug}`, { replace: true });
    }
  }, [provider, slug, navigate]);

  if (status === 'loading' && !provider) {
    return (
      <PublicLayout>
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-ink-muted">
          <Spinner className="size-4 text-brand-ink" /> {t.common.loading}
        </p>
      </PublicLayout>
    );
  }

  if (!provider) {
    return (
      <PublicLayout title={copy.pageNotFound}>
        <p className="text-sm text-ink-muted">{error ?? copy.noPageHere}</p>
      </PublicLayout>
    );
  }

  if (step === 'payment' && result) {
    return (
      <PublicLayout
        businessName={provider.businessName}
        brandColor={provider.brandColor}
        logoUrl={provider.logoUrl}
        title={copy.almostThere}
      >
        <DepositWaiting
          phone={clientPhone}
          onStartOver={() => {
            reset();
            void loadProvider(slug);
          }}
        />
      </PublicLayout>
    );
  }

  if (step === 'done' && result) {
    const paidDeposit = result.deposit?.amountCents;

    return (
      <PublicLayout
        businessName={provider.businessName}
        brandColor={provider.brandColor}
        logoUrl={provider.logoUrl}
        title={copy.bookedIn}
      >
        <div className="flex flex-col gap-4">
          <Card className="px-4 py-3">
            <p className="text-sm text-ink-muted">{copy.reference}</p>
            <p className="font-medium tabular-nums text-brand-900">{result.reference}</p>
            {selectedSlot ? (
              <p className="mt-2 text-sm text-brand-900">
                {zonedDateTime(selectedSlot, provider.timezone)}
              </p>
            ) : null}
            {paidDeposit ? (
              <p className="mt-2 text-sm text-ink-muted">
                {copy.depositPaid}{' '}
                <span className="font-medium tabular-nums text-brand-900">
                  {formatMoney(paidDeposit, 'EUR')}
                </span>
              </p>
            ) : null}
          </Card>

          <p className="text-sm text-ink-muted">
            {paidDeposit ? copy.heldSlot : copy.willConfirm(provider.businessName)}
          </p>

          {result.manageToken ? (
            <Link
              to={`/booking/${result.manageToken}`}
              className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
            >
              {copy.viewOrCancel}
            </Link>
          ) : null}
        </div>
      </PublicLayout>
    );
  }

  const headings = {
    service: { title: copy.stepService, subtitle: copy.stepServiceSub },
    person: { title: copy.stepPerson, subtitle: copy.stepPersonSub },
    slot: { title: copy.stepSlot, subtitle: undefined },
    details: { title: copy.stepDetails, subtitle: undefined },
    payment: { title: '', subtitle: undefined },
    done: { title: '', subtitle: undefined },
  } as const;

  return (
    <PublicLayout
      businessName={provider.businessName}
      brandColor={provider.brandColor}
      logoUrl={provider.logoUrl}
      title={headings[step].title}
      subtitle={headings[step].subtitle}
      size={step === 'slot' ? 'lg' : 'md'}
    >
      <PublicBookingFlow provider={provider} />
    </PublicLayout>
  );
}
