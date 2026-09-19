import { api } from './client';
import type { Page } from './pagination';

export interface ClientRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface CreateClientPayload {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export const clientsApi = {
  list: (search?: string, paging?: { page?: number; pageSize?: number }) =>
    api.get<Page<ClientRecord>>(
      `/clients?${new URLSearchParams({
        ...(search ? { search } : {}),
        ...(paging?.page ? { page: String(paging.page) } : {}),
        ...(paging?.pageSize ? { pageSize: String(paging.pageSize) } : {}),
      })}`,
    ),
  /**
   * The first twenty matches, for a picker. A picker never needs the whole list — it needs
   * the few rows that match what has been typed, and the server already does the matching,
   * including a phone number typed without its spaces.
   */
  search: async (term: string): Promise<ClientRecord[]> =>
    (await clientsApi.list(term || undefined, { pageSize: 20 })).items,
  /** Whether the business has any clients at all, without fetching them. */
  any: async (): Promise<boolean> => (await clientsApi.list(undefined, { pageSize: 1 })).total > 0,
  create: (payload: CreateClientPayload) => api.post<ClientRecord>('/clients', payload),
  update: (id: string, payload: UpdateClientPayload) =>
    api.patch<ClientRecord>(`/clients/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/clients/${id}`),
};
