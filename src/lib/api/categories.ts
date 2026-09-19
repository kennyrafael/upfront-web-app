import { api } from './client';

export interface CategoryItem {
  id: string;
  name: string;
  position: number;
}

export interface CreateCategoryPayload {
  name: string;
  position?: number;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export const categoriesApi = {
  list: () => api.get<CategoryItem[]>('/categories'),
  /** How many services each holds, keyed by id — so a delete can say what it will detach. */
  counts: () => api.get<Record<string, number>>('/categories/counts'),
  create: (payload: CreateCategoryPayload) => api.post<CategoryItem>('/categories', payload),
  update: (id: string, payload: UpdateCategoryPayload) =>
    api.patch<CategoryItem>(`/categories/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/categories/${id}`),
};
