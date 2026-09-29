import { api } from './client';

export const WAITLIST_STATUSES = ['waiting', 'notified', 'booked', 'cancelled'] as const;
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

/** One person waiting, already flattened for the row that shows them. */
export interface WaitlistEntry {
  id: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  /** The basket, joined by the API — a row has no room for a list. */
  services: string;
  /** Absent means they will take anybody, which is the common answer. */
  employeeName?: string;
  fromDate: string;
  toDate: string;
  durationMinutes: number;
  status: WaitlistStatus;
  notifiedAt?: string;
}

export interface CreateWaitlistEntryPayload {
  clientId: string;
  serviceIds?: string[];
  employeeId?: string;
  fromDate: string;
  toDate: string;
  durationMinutes: number;
}

/**
 * Only the people still waiting come back — the API filters on `waiting`, so this list is
 * the queue rather than its history. Somebody who was told about an opening has had their
 * turn and leaves it.
 */
export const waitlistApi = {
  list: () => api.get<WaitlistEntry[]>('/waitlist'),
  create: (payload: CreateWaitlistEntryPayload) => api.post<WaitlistEntry>('/waitlist', payload),
  cancel: (id: string) => api.delete<WaitlistEntry>(`/waitlist/${id}`),
};
