import type { WorkingHours } from './businesses';
import { api } from './client';

/**
 * A person who performs services.
 *
 * Not the same thing as a login: a junior who never signs in is still an employee with a
 * calendar, and a receptionist who books for everybody has no calendar at all.
 */

/** One service this person performs, and what it costs when they do. */
export interface EmployeeSkill {
  serviceId: string;
  /** Absent means the catalog price. */
  priceCents?: number;
  durationMinutes?: number;
}
export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /**
   * What they do. **Empty means the whole catalog** — the same rule as hours, so a new
   * colleague is bookable for everything until somebody narrows them.
   */
  services: EmployeeSkill[];

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
  services?: EmployeeSkill[];
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

/** A stretch somebody is away. Instants, because availability is. */
export interface TimeOff {
  id: string;
  employeeId: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  reason?: string;
}

/**
 * An appointment that is now inside time off just recorded.
 *
 * Reported rather than cancelled: a sick day marked at 09:00 does not undo the 14:00
 * already in the book, and who to call is a decision for a person.
 */
export interface ClashingBooking {
  id: string;
  startsAt: string;
  clientName?: string;
}

export interface TimeOffPayload {
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  reason?: string;
}

export const timeOffApi = {
  list: (employeeId: string, from: string, to: string) =>
    api.get<TimeOff[]>(
      `/employees/${employeeId}/time-off?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  add: (employeeId: string, payload: TimeOffPayload) =>
    api.post<{ timeOff: TimeOff; clashes: ClashingBooking[] }>(
      `/employees/${employeeId}/time-off`,
      payload,
    ),
  remove: (id: string) => api.delete<void>(`/employees/time-off/${id}`),
};
