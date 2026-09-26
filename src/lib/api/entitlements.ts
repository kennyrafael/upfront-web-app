import { api } from './client';

/**
 * What this business may do, as the server resolves it.
 *
 * **The client never maps a plan name to features.** It reads this. Otherwise the rule exists
 * twice and disagrees once — and the copy that disagrees is the one on the customer's screen,
 * telling them they can do something the server is about to refuse.
 */
export interface Entitlements {
  sms: boolean;
  smsPerMonth: number;
  /** `null` means no limit. `Infinity` is not JSON, and `0` would read as "none allowed". */
  employees: number | null;
  employeesUnlimited: boolean;
  recurring: boolean;
  waitlist: boolean;
}

/**
 * How much of this month's SMS allowance is left.
 *
 * A separate call from the entitlements, and deliberately so: the allowance is a question
 * about the business and the usage is a count of notifications, and the two live in different
 * modules on the server for the same reason.
 */
export interface SmsUsage {
  enabled: boolean;
  used: number;
  allowance: number;
  remaining: number;
}

export const entitlementsApi = {
  mine: () => api.get<Entitlements>('/me/entitlements'),
  smsUsage: () => api.get<SmsUsage>('/me/sms-usage'),
};
