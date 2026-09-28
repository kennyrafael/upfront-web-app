import { fileURLToPath } from 'node:url';
import meticulous from '@alwaysmeticulous/recorder-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The one deployment that must never record.
 *
 * Keyed the same way as `assertKeysMatchTheEnvironment` in the API, and deliberately on
 * `VERCEL_ENV` alone. Not `NODE_ENV`, which Vercel sets to `production` for every build
 * including a preview one; and **not the branch name**, which says nothing `VERCEL_ENV` does
 * not now that previews are the non-production environment. Pinning it to a branch would mean
 * that the day production moves to a release branch, this reads "not production" and starts
 * recording real clients' sessions — the failure being silent in the direction that matters.
 *
 * Absent locally, where the answer is "not production" and recording is the entire point.
 */
const isLiveProduction = process.env.VERCEL_ENV === 'production';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    meticulous({
      /**
       * Public by design, and worth saying so rather than leaving the next reader to wonder.
       * The plugin emits this verbatim as `data-recording-token` on a script tag, so it ships
       * in the HTML to every visitor whatever we do with it — there is nothing to protect.
       *
       * **It is not `METICULOUS_API_TOKEN`**, which drives the GitHub Action, can read the
       * organisation, and belongs in repository secrets. The two look alike and only one of
       * them is safe here.
       */
      recordingToken: 'orw7RzmAeleIjG5oNHUSu4BJasdTEHO01jc58UY8',
      /**
       * **The default is `"development"`, which is the wrong half of the product.**
       *
       * It injects only under `vite serve`, so the recorder would exist on a developer's
       * laptop and nowhere else. Two things break quietly:
       *
       * - the sandbox is the shared environment where sessions worth recording actually
       *   happen, and it is a build, not a dev server;
       * - Meticulous replays against a built `dist`, so a production-shaped build with no
       *   recorder in it gives its own test runs nothing to drive.
       *
       * So: every build except real production. Recording there would put clients' names,
       * phone numbers and booking notes — plus, per Meticulous's own warning, the
       * authorization headers on recorded requests — into a third party, which makes them an
       * Art. 28 sub-processor of providers' client data exactly as Arpoone is. That is a DPA
       * and a decision, not a default. Drop `enabled` to record everywhere once it is one.
       */
      enabled: () => !isLiveProduction,
      /**
       * A string, not the boolean — the plugin drops an attribute whose value is `false`, so
       * `false` here would omit the very attribute it looks like it sets. It tells the snippet
       * to use non-production thresholds, which is true everywhere it now runs.
       */
      attributes: { 'data-is-production-environment': 'false' },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      /**
       * The client fetches `/api/...` relative to its own origin, so something has to
       * forward it. This is that something in development; `web/vercel.json` rewrites the
       * same prefix in production, and the two must not disagree.
       *
       * **Same origin rather than calling the API host directly**, and the refresh cookie is
       * why: it is `sameSite: lax`, which a browser will not send on a cross-site request.
       * Pointing the client at the API host would log people in and then fail to keep them
       * logged in, which is worse than failing outright.
       */
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
