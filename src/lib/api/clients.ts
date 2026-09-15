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
  create: (payload: CreateClientPayload) => api.post<ClientRecord>('/clients', payload),
  update: (id: string, payload: UpdateClientPayload) =>
    api.patch<ClientRecord>(`/clients/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/clients/${id}`),
};
