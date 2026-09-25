import { loadConnectAndInitialize, type StripeConnectInstance } from '@stripe/connect-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Spinner } from '@/components/atoms';
import { useCopy } from '@/lib';
import { ApiError, type ConnectStatus, connectApi } from '@/lib/api';

const PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;

/**
 * Connecting the shop's own payments account, without leaving Upfront.
 *
 * **The provider signs up nowhere.** The account is created through our API and the form
 * below is Stripe's own embedded component, mounted inside this card — so the identity
 * checks are theirs to keep current, and the page is still ours. That is the whole reason
 * the gateway changed: on Eupago every provider had to go and register themselves.
 *
 * Stripe's component is a web component rather than a React one, so it is attached to a
 * `div` by hand. It is not rendered until somebody asks, because it fetches a script and
 * builds a form nobody who is already connected needs to see.
 */
export function PaymentsSettings() {
  const copy = useCopy();
  const [status, setStatus] = useState<ConnectStatus>();
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  const mount = useRef<HTMLDivElement>(null);
  const banner = useRef<HTMLDivElement>(null);
  /** The Connect instance, kept so the components are attached to one and not one each. */
  const connect = useRef<StripeConnectInstance | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      setStatus(await connectApi.status());
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : copy.payoutAccount.errorRead);
    }
  }, [copy.payoutAccount.errorRead]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Builds the Connect instance, whose `fetchClientSecret` is called both now and again
   * whenever Stripe decides the secret has aged out — which is why it is a function that
   * asks our API rather than a value fetched once.
   */
  const instance = useCallback(async (): Promise<StripeConnectInstance | undefined> => {
    if (!PUBLIC_KEY) {
      setError(copy.payoutAccount.notConfigured);
      return undefined;
    }
    if (connect.current) return connect.current;

    connect.current = loadConnectAndInitialize({
      publishableKey: PUBLIC_KEY,
      fetchClientSecret: async () => (await connectApi.session()).clientSecret,
      appearance: {
        // Read off our own tokens so the form wears the accent the business picked, rather
        // than Stripe's blue in the middle of an Upfront page.
        variables: {
          colorPrimary: cssValue('--accent-9', '#2f6f5e'),
          colorText: cssValue('--gray-12', '#1c2b26'),
          colorBackground: cssValue('--color-panel-solid', '#ffffff'),
          borderRadius: '10px',
        },
      },
    });
    return connect.current;
  }, [copy.payoutAccount.notConfigured]);

  /** The banner is where Stripe asks for something that has come up since onboarding. */
  useEffect(() => {
    if (!status || status.state === 'not_connected' || !banner.current) return;

    let attached: HTMLElement | undefined;
    void (async () => {
      const created = (await instance())?.create('notification-banner');
      if (!created || !banner.current) return;
      attached = created;
      banner.current.appendChild(created);
    })();

    return () => attached?.remove();
  }, [status, instance]);

  useEffect(() => {
    if (!onboarding || !mount.current) return;

    let attached: HTMLElement | undefined;
    void (async () => {
      const created = (await instance())?.create('account-onboarding');
      if (!created || !mount.current) return;

      // Stripe calls this when the form is done. It is **not** proof of anything: what
      // matters is what the account can actually do, which only the gateway can say. So it
      // closes the form and asks.
      created.setOnExit(() => {
        setOnboarding(false);
        void refresh();
      });

      attached = created;
      mount.current.appendChild(created);
    })();

    return () => attached?.remove();
  }, [onboarding, instance, refresh]);

  async function start() {
    setStarting(true);
    setError(undefined);
    try {
      // Creates the account if there is not one yet. Idempotent on the server, so pressing
      // this twice does not leave a second account behind — invisible, unfinished, and
      // billed for all the same.
      await connectApi.session();
      setOnboarding(true);
      await refresh();
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : copy.payoutAccount.errorStart);
    } finally {
      setStarting(false);
    }
  }

  const state = status?.state;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>{copy.payoutAccount.title}</CardTitle>
          <p className="mt-1 text-sm text-ink-muted">{copy.payoutAccount.lede}</p>
        </div>
        <Badge variant={state === 'active' ? 'brand' : state === 'pending' ? 'warning' : 'neutral'}>
          {state === 'active'
            ? copy.payoutAccount.active
            : state === 'pending'
              ? copy.payoutAccount.pending
              : copy.payoutAccount.notConnected}
        </Badge>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        {!status ? (
          <div className="flex items-center gap-2 text-ink-muted text-sm">
            <Spinner className="size-4 text-brand-ink" /> {copy.payoutAccount.checking}
          </div>
        ) : (
          <>
            {/* Empty until Stripe has something to say, and then it is the only place a new
                requirement appears at all. */}
            <div ref={banner} />

            {state === 'active' ? (
              <p className="text-sm text-ink-muted">{copy.payoutAccount.activeBody}</p>
            ) : (
              <p className="text-sm text-ink-muted">
                {state === 'pending'
                  ? copy.payoutAccount.pendingBody
                  : copy.payoutAccount.notConnectedBody}
              </p>
            )}

            {state === 'pending' && status.requirementsDue.length > 0 ? (
              // The gateway's own field names, shown small and plainly. Not translated,
              // because inventing our own words for `company.verification.document` is how a
              // support conversation stops being possible.
              <p className="text-ink-muted text-xs">
                {copy.payoutAccount.outstanding}: {status.requirementsDue.join(', ')}
              </p>
            ) : null}

            {onboarding ? (
              <div ref={mount} />
            ) : (
              <div>
                <Button loading={starting} onClick={() => void start()}>
                  {state === 'not_connected'
                    ? copy.payoutAccount.connect
                    : copy.payoutAccount.finish}
                </Button>
              </div>
            )}
          </>
        )}

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/8 px-3 py-2 text-danger-ink text-sm">
            {error}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

/**
 * One of our own CSS variables, resolved to a value Stripe's iframe can use.
 *
 * It cannot inherit our cascade — it is a different document — so the colours have to be
 * read out and handed over. The fallback matters for the same reason: a variable that has
 * not been defined yet would otherwise pass an empty string, which Stripe rejects.
 */
function cssValue(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
