import { useAlertStore } from './useAlertStore';
import { useBookingStore } from './useBookingStore';
import { useBusinessStore } from './useBusinessStore';
import { useCategoryStore } from './useCategoryStore';
import { useClientStore } from './useClientStore';
import { useComplianceStore } from './useComplianceStore';
import { useEmployeeStore } from './useEmployeeStore';
import { useEntitlementsStore } from './useEntitlementsStore';
import { usePaymentStore } from './usePaymentStore';
import { useServiceStore } from './useServiceStore';
import { useWaitlistStore } from './useWaitlistStore';

/**
 * Clears every domain store. Called on sign-out so the next account never sees
 * the previous one's data. Lives outside the stores to avoid importing between them.
 */
export function resetDomainStores(): void {
  useBusinessStore.getState().reset();
  useServiceStore.getState().reset();
  useCategoryStore.getState().reset();
  useClientStore.getState().reset();
  useBookingStore.getState().reset();
  useComplianceStore.getState().reset();
  usePaymentStore.getState().reset();
  useAlertStore.getState().reset();
  useEmployeeStore.getState().reset();
  useEntitlementsStore.getState().reset();
  useWaitlistStore.getState().reset();
}
