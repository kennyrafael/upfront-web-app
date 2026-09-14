import { useProviderStore } from './useProviderStore';
import { useServiceStore } from './useServiceStore';

/**
 * Clears every domain store. Called on sign-out so the next account never sees
 * the previous one's data. Lives outside the stores to avoid importing between them.
 */
export function resetDomainStores(): void {
  useProviderStore.getState().reset();
  useServiceStore.getState().reset();
}
