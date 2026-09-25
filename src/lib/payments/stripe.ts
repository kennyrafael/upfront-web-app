import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * The publishable key. Safe in the bundle — it identifies the account and authorises
 * nothing; every amount is decided on the server.
 */
const PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;

let pending: Promise<Stripe | null> | undefined;

/**
 * Stripe.js, loaded once and shared.
 *
 * `loadStripe` injects a script tag, so calling it per component would fetch it repeatedly
 * and build a second Stripe instance each time. Deliberately **not** called at module scope:
 * that would load Stripe on every page of the app, including the ones that never take money.
 *
 * Returns null when no key is configured, which is the ordinary state of a checkout with no
 * Stripe account. Callers say so rather than throwing.
 */
export function stripeClient(): Promise<Stripe | null> {
  if (!PUBLIC_KEY) return Promise.resolve(null);
  if (!pending) pending = loadStripe(PUBLIC_KEY);
  return pending;
}

export type MbWayOutcome =
  | { ok: true }
  | { ok: false; reason: 'unconfigured' | 'declined' | 'unsupported'; message?: string };

/**
 * `confirmMbWayPayment`, which Stripe documents but `@stripe/stripe-js@9.17` does not yet
 * declare.
 *
 * Narrow on purpose: exactly the one call, with exactly the arguments the documentation
 * gives, so the shim cannot quietly drift into asserting anything else. Delete it when the
 * typings catch up — see docs/known-issues.md.
 */
interface StripeWithMbWay {
  confirmMbWayPayment(
    clientSecret: string,
    data: { payment_method: { billing_details: { phone: string } } },
  ): Promise<{ error?: { message?: string } }>;
}

/**
 * Asks for an MB WAY payment and waits for the person to approve it in their app.
 *
 * **This is the half of a payment the server cannot do.** Stripe has no documented way to
 * confirm MB WAY from a backend: the intent is created there, and a browser turns it into a
 * notification on somebody's phone. Which browser depends on who is paying — the client's on
 * the public booking page, the shop's at the counter.
 *
 * It resolves when the payment succeeds or fails, which can be a minute of somebody looking
 * for their phone. **The result is a hint, not the record.** Settlement is the webhook: this
 * page could be closed, refreshed, or lying, and the money would still have moved. Callers
 * use this to stop waiting, never to mark anything paid.
 */
export async function confirmMbWay(clientSecret: string, phone: string): Promise<MbWayOutcome> {
  const stripe = await stripeClient();
  if (!stripe) return { ok: false, reason: 'unconfigured' };

  const withMbWay = stripe as unknown as Partial<StripeWithMbWay>;
  // Checked rather than assumed. The shim above describes a method the typings do not carry,
  // so it is worth confirming Stripe.js actually shipped it before calling into thin air —
  // the alternative is a TypeError the payer would see as a blank screen.
  if (typeof withMbWay.confirmMbWayPayment !== 'function') {
    return { ok: false, reason: 'unsupported' };
  }

  const { error } = await withMbWay.confirmMbWayPayment(clientSecret, {
    payment_method: { billing_details: { phone } },
  });

  // Stripe's message is written for the payer and is already localised by the browser's
  // locale, so it is passed through rather than replaced. What it will not say is anything
  // about our integration; that lands in the console and the dashboard, not here.
  return error ? { ok: false, reason: 'declined', message: error.message } : { ok: true };
}
