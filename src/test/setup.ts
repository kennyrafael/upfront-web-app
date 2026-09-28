import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Unmount between tests.
 *
 * Testing Library renders into a container it appends to `document.body`, and these components
 * portal — Radix's popover content lands outside that container entirely. Without this, a
 * `getByRole('option')` in one test can find a list left open by the previous one, which shows
 * up as a test that passes alone and fails in the suite.
 */
afterEach(cleanup);
