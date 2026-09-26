import { loadConnectAndInitialize, type StripeConnectInstance } from '@stripe/connect-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Spinner } from '@/components/atoms';
import { useCopy } from '@/lib';
import { ApiError, type ConnectStatus, connectApi } from '@/lib/api';
import { useThemeStore } from '@/stores';

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
  const theme = useThemeStore((state) => state.theme);

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
      appearance: { variables: appearanceVariables() },
    });
    return connect.current;
  }, [copy.payoutAccount.notConfigured]);

  /**
   * Re-themes the mounted form when the appearance changes.
   *
   * **The variables are read once at `loadConnectAndInitialize` and never again**, so
   * without this a provider who switches to dark keeps a white form in the middle of a dark
   * page until they reload. `update` is the supported way to change it in place; the
   * component keeps whatever the provider had already typed.
   *
   * Driven off the theme store *and* the system preference, because `system` is a real
   * choice here and the colour it resolves to can change without anything in the app
   * happening at all.
   */
  useEffect(() => {
    const retheme = () =>
      connect.current?.update({ appearance: { variables: appearanceVariables() } });

    // After paint: `applyTheme` writes to the document and the tokens are only resolved once
    // the browser has recalculated styles. Reading them in the same tick returns the values
    // that are on their way out.
    const id = requestAnimationFrame(retheme);

    if (theme !== 'system') return () => cancelAnimationFrame(id);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', retheme);
    return () => {
      cancelAnimationFrame(id);
      media.removeEventListener('change', retheme);
    };
  }, [theme]);

  /** The banner is where Stripe asks for something that has come up since onboarding. */
  useEffect(() => {
    if (!status || status.state === 'not_connected' || !banner.current) return;
    // Mounting this before the business details exist is what produced Stripe's opaque
    // "An error occurred while authenticating your account": the banner fetches a session
    // as it mounts, and the API will not open one yet. It appears by itself whenever an
    // account exists, so this guard is the only thing standing between a half-filled
    // profile and an error nobody can act on.
    if (status.detailsMissing.length > 0) return;

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
      if (!created || !mount.current) {
        // Back to the button rather than sitting in an empty panel. `start` checks the same
        // thing first, so this is the case where Stripe.js was there and then was not.
        setOnboarding(false);
        return;
      }

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

      // **The form replaces this button, so it must be known to exist first.** Switching to
      // onboarding when Stripe.js cannot load leaves an empty box where the button was, with
      // nothing to press and no way back — which is exactly what happened on a dev install
      // with no publishable key configured.
      if (!(await instance())) return;

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

            {status.detailsMissing.length > 0 ? (
              // Said here rather than letting the button fail: the provider is one link away
              // from fixing it, and Stripe's own message for the same state names neither
              // the fields nor where they live.
              <div className="rounded-lg bg-warning/8 px-3 py-3 text-sm">
                <p className="text-ink">{copy.payoutAccount.detailsNeeded}</p>
                <ul className="mt-2 list-disc pl-5 text-ink-muted">
                  {status.detailsMissing.map((field) => (
                    <li key={field}>{copy.payoutAccount.detailNames[field] ?? field}</li>
                  ))}
                </ul>
                <a className="mt-3 inline-block text-brand-ink underline" href="/settings#business">
                  {copy.payoutAccount.goToDetails}
                </a>
              </div>
            ) : onboarding ? (
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
/**
 * Our tokens, in the names Stripe's appearance API uses.
 *
 * Read fresh every time rather than captured, because the same token names resolve to
 * different colours in light and dark — which is the whole point of the bridge in
 * `index.css`. Nothing here is a hex literal except the fallbacks, so a business that
 * changes its accent changes this too.
 *
 * `colorBackground` is the panel rather than the page: the form sits inside a card, and
 * matching the page would leave it floating on the wrong shade.
 */
function appearanceVariables(): Record<string, string> {
  return {
    fontFamily: cssValue('--default-font-family', "'Inter', ui-sans-serif, system-ui"),
    borderRadius: '10px',

    colorPrimary: cssValue('--accent-9', '#2f6f5e'),
    colorBackground: cssValue('--color-panel-solid', '#ffffff'),
    colorText: cssValue('--gray-12', '#1c2b26'),
    colorSecondaryText: cssValue('--gray-11', '#5b6b66'),
    colorDanger: cssValue('--red-9', '#d5323a'),
    colorBorder: cssValue('--gray-6', '#d8e0dd'),

    /**
     * The panels inside the form — a summary row, a highlighted block.
     *
     * **This is the one that caused the halos.** It defaults to white, so in dark mode every
     * inner card was drawn as a pale slab over a dark page and read as a glow around the
     * edges. It is a *raised* surface rather than the page, hence step 2 and not the panel
     * colour, or the sections lose their edges entirely.
     */
    offsetBackgroundColor: cssValue('--gray-2', '#f7f9f8'),
    formBackgroundColor: cssValue('--gray-2', '#f7f9f8'),
    formHighlightColorBorder: cssValue('--accent-8', '#5aa38d'),
    formAccentColor: cssValue('--accent-9', '#2f6f5e'),
    formPlaceholderTextColor: cssValue('--gray-9', '#8b9995'),

    buttonPrimaryColorBackground: cssValue('--accent-9', '#2f6f5e'),
    buttonPrimaryColorBorder: cssValue('--accent-9', '#2f6f5e'),
    buttonPrimaryColorText: cssValue('--accent-contrast', '#ffffff'),
    buttonSecondaryColorBackground: cssValue('--gray-3', '#eef2f0'),
    buttonSecondaryColorBorder: cssValue('--gray-6', '#d8e0dd'),
    buttonSecondaryColorText: cssValue('--gray-12', '#1c2b26'),

    // Links inside the form. Step 11, not 9 — the same rule as `brand-ink`, because step 9
    // is the block buttons are painted with and fails contrast as text.
    actionPrimaryColorText: cssValue('--accent-11', '#217a5f'),

    // Meanings rather than decoration, so these follow the fixed scales and not the accent
    // a business happens to have picked.
    badgeNeutralColorBackground: cssValue('--gray-3', '#eef2f0'),
    badgeNeutralColorText: cssValue('--gray-11', '#5b6b66'),
    badgeNeutralColorBorder: cssValue('--gray-6', '#d8e0dd'),
    badgeSuccessColorBackground: cssValue('--jade-3', '#ddf3ea'),
    badgeSuccessColorText: cssValue('--jade-11', '#208368'),
    badgeSuccessColorBorder: cssValue('--jade-6', '#a8d9c4'),
    badgeWarningColorBackground: cssValue('--amber-3', '#fff4d5'),
    badgeWarningColorText: cssValue('--amber-11', '#ab6400'),
    badgeWarningColorBorder: cssValue('--amber-6', '#f3d673'),
    badgeDangerColorBackground: cssValue('--red-3', '#ffdbdc'),
    badgeDangerColorText: cssValue('--red-11', '#ce2c31'),
    badgeDangerColorBorder: cssValue('--red-6', '#f4a9aa'),
  };
}

/**
 * A Radix Themes token, as it currently resolves.
 *
 * **Read off `.radix-themes`, not `:root`.** Themes declares its scales on its own element,
 * so `--accent-9` and `--color-panel-solid` come back *empty* from the document root and
 * `--gray-12` comes back with the light value whatever the appearance is. Every fallback
 * below then won, which is why the embedded form was white inside a dark page and looked
 * like the theming had never been wired up at all.
 */
function cssValue(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const scope = document.querySelector('.radix-themes') ?? document.documentElement;
  const value = getComputedStyle(scope).getPropertyValue(name).trim();
  return value || fallback;
}
