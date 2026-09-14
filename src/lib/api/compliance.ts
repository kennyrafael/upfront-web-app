import { api } from './client';

export interface QuarterSummary {
  quarter: 1 | 2 | 3 | 4;
  issuedCents: number;
  draftCents: number;
  invoiceCount: number;
}

export interface UpcomingDeadline {
  kind: 'iva' | 'social_security' | 'irs';
  label: string;
  detail: string;
  dueOn: string;
  daysUntil: number;
}

export interface ComplianceSummary {
  year: number;
  issuedCents: number;
  draftCents: number;
  quarters: QuarterSummary[];
  threshold: {
    limitCents: number;
    usedCents: number;
    ratio: number;
    status: 'ok' | 'warning' | 'exceeded';
  };
  unbilled: { count: number; totalCents: number };
  deadlines: UpcomingDeadline[];
  reference: { lastVerified: string; sources: string[] };
}

export const complianceApi = {
  summary: (year: number) => api.get<ComplianceSummary>(`/compliance/summary?year=${year}`),
};
