import type { ServiceSegment } from './bookings';
import { api } from './client';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  active: boolean;
  /**
   * The stretches it holds the person for. Absent means one solid block.
   *
   * A colour is twenty minutes of work, thirty-five developing, twenty-five more — and
   * the chair is free in the middle.
   */
  segments?: ServiceSegment[];
  /** The heading it sits under, if the business uses them. */
  categoryId?: string;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
  active?: boolean;
  /**
   * The shape, or null to make it solid again. Sending parts sets the duration from them.
   */
  segments?: ServiceSegment[] | null;
  /** A category id, or null to ungroup it. Undefined leaves it as it is. */
  category?: string | null;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export const servicesApi = {
  list: (includeInactive = false) =>
    api.get<ServiceItem[]>(`/services${includeInactive ? '?includeInactive=true' : ''}`),
  create: (payload: CreateServicePayload) => api.post<ServiceItem>('/services', payload),
  update: (id: string, payload: UpdateServicePayload) =>
    api.patch<ServiceItem>(`/services/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/services/${id}`),
};
