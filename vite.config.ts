import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import meticulous from "@alwaysmeticulous/recorder-plugin/vite";
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    meticulous({
      recordingToken: "orw7RzmAeleIjG5oNHUSu4BJasdTEHO01jc58UY8",
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
