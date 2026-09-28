import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Separate from `vite.config.ts` on purpose.
 *
 * That file carries the Meticulous recorder plugin, which injects a script tag into emitted
 * HTML. Tests render components directly and never build a page, so the plugin has nothing to
 * do here — and a test run is the wrong place to be reaching for a recording endpoint. The cost
 * is repeating the alias and the react plugin, which is cheaper than the alternative.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Only our own tests. Without this a leftover `dist/` gets collected too.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
