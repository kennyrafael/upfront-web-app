/**
 * The API's password rule, mirrored so a form can say so before the round trip.
 *
 * Mirrored rather than fetched, which means it can drift — and it did: sign-up checked for
 * eight here while reset checked for ten, against a server that had three different
 * minimums of its own. There is one rule on each side now (`api/src/modules/auth/password.ts`)
 * and every form reads this one.
 */
export const PASSWORD_MIN = 10;

/** bcrypt's limit, in bytes: past it, characters are silently ignored. See the API side. */
export const PASSWORD_MAX_BYTES = 72;

/** Why a password is refused, or nothing. The caller chooses the words. */
export function passwordProblem(password: string): 'short' | 'long' | undefined {
  if (password.length < PASSWORD_MIN) return 'short';
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return 'long';
  return undefined;
}
