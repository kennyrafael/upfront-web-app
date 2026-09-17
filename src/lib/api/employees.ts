import type { WorkingHours } from './businesses';
import { api } from './client';

/**
 * A person who performs services.
 *
 * Not the same thing as a login: a junior who never signs in is still an employee with a
 * calendar, and a receptionist who books for everybody has no calendar at all.
 */
export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /** When this person is in. Crossed with the shop's hours, never read alone. */
  hours: WorkingHours[];
  active: boolean;
  /** `#RRGGBB` for their calendar column. Absent means the calendar picks one. */
  color?: string;
  /** Set when they invoice under their own name. Carried, not yet acted on. */
  nif?: string;
  payoutIban?: string;
}

export interface EmployeePayload {
  name: string;
  email?: string;
  phone?: string;
  hours?: WorkingHours[];
  color?: string;
  nif?: string;
  payoutIban?: string;
}

export const employeesApi = {
  /** Active people only unless asked otherwise — somebody who left stays out of every form. */
  list: (includeInactive = false) =>
    api.get<Employee[]>(`/employees${includeInactive ? '?includeInactive=true' : ''}`),
  create: (payload: EmployeePayload) => api.post<Employee>('/employees', payload),
  update: (id: string, payload: Partial<EmployeePayload> & { active?: boolean }) =>
    api.patch<Employee>(`/employees/${id}`, payload),
  /**
   * Deactivates. There is no delete — they are on every past booking and every invoice
   * derived from one — so this returns the row with `active: false` rather than nothing.
   */
  deactivate: (id: string) => api.delete<Employee>(`/employees/${id}`),
};
