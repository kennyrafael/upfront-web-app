import { api } from './client';

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
  list: (search?: string) =>
    api.get<ClientRecord[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  create: (payload: CreateClientPayload) => api.post<ClientRecord>('/clients', payload),
  update: (id: string, payload: UpdateClientPayload) =>
    api.patch<ClientRecord>(`/clients/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/clients/${id}`),
};
