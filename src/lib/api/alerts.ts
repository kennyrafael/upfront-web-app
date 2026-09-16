import { api } from './client';
import type { Page } from './pagination';

export const ALERT_KINDS = [
  'booking_created',
  'booking_cancelled',
  'booking_rescheduled',
  'deposit_paid',
  'deposit_refunded',
  'hold_expired',
] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export interface Alert {
  id: string;
  kind: AlertKind;
  title: string;
  body: string;
  bookingId?: string;
  createdAt: string;
  /** Absent while unread. */
  readAt?: string;
}

export const alertsApi = {
  findAll: (pageSize = 20) => api.get<Page<Alert>>(`/alerts?pageSize=${pageSize}`),
  /** Its own call because it is polled; the feed is only fetched when the menu opens. */
  unreadCount: () => api.get<{ unread: number }>('/alerts/unread-count'),
  markAllRead: () => api.post<void>('/alerts/read'),
};
