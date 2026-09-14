import { useBookingStore } from './useBookingStore';
import { useClientStore } from './useClientStore';
import { useComplianceStore } from './useComplianceStore';
import { useProviderStore } from './useProviderStore';
import { useServiceStore } from './useServiceStore';

/**
 * Clears every domain store. Called on sign-out so the next account never sees
 * the previous one's data. Lives outside the stores to avoid importing between them.
 */
export function resetDomainStores(): void {
  useProviderStore.getState().reset();
  useServiceStore.getState().reset();
  useClientStore.getState().reset();
  useBookingStore.getState().reset();
  useComplianceStore.getState().reset();
}
