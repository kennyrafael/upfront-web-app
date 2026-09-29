import { api } from './client';

/** Monthly or yearly. Matches the `ciclo` the site's plans page sends. */
export type BillingCycle = 'month' | 'year';

export interface Subscription {
  plan: string;
  cycle?: BillingCycle;
  /** `active`, `past_due`, `canceled`, `pending`, or `none` when nothing has been bought. */
  state: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  /** Whether anything is actually being billed, or they are simply on a plan. */
  billed: boolean;
}

/**
 * The answer to "put this business on this plan".
 *
 * **`checkoutUrl` is absent for the free tier**, which is not an error — a €0 subscription needs
 * no card, so the server applies it and there is nowhere to send the browser. A caller that
 * assumed a URL would send somebody nowhere on the one plan that must always work.
 */
export interface CheckoutStarted {
  plan: string;
  checkoutUrl?: string;
}

export const subscriptionsApi = {
  mine: () => api.get<Subscription>('/subscriptions/me'),
  checkout: (plan: string, cycle: BillingCycle) =>
    api.post<CheckoutStarted>('/subscriptions/checkout', { plan, cycle }),
};
