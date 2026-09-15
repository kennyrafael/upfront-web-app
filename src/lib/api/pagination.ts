/** Mirrors the API's envelope. See `api/src/common/pagination.ts`. */
export interface Page<T> {
  items: T[];
  /** Rows matching the filter, not rows returned — so truncation is detectable. */
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * The API's ceiling on one request.
 *
 * Used by the screens that genuinely need everything in a bounded range — the week calendar,
 * a client's booking history — where a second page would mean quietly missing appointments.
 */
export const MAX_PAGE_SIZE = 200;

/** `?page=2&pageSize=50`, or nothing at all when neither was asked for. */
export function pageQuery(paging?: { page?: number; pageSize?: number }): string {
  const params = new URLSearchParams();
  if (paging?.page) params.set('page', String(paging.page));
  if (paging?.pageSize) params.set('pageSize', String(paging.pageSize));
  return params.toString();
}
