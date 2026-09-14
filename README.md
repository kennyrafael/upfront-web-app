# Upfront Web

React + Vite frontend.

## Structure

```
src/
  components/
    atoms/        Button, Input, Label, Badge, Spinner
    molecules/    FormField
    organisms/    LoginForm, SignupForm
    layouts/      AuthLayout, DashboardLayout
  lib/
    api/          fetch client + typed endpoint wrappers
    utils/        cn() class merger
  pages/          route-level screens
  routes/         router and route guards
  stores/         Zustand stores, one per domain
```

Every folder has an `index.ts`, so imports read as `import { Button } from '@/components'`.

Scaffold a new component rather than creating the three files by hand:

```bash
npm run gen:component -- Dialog atoms
```

## Conventions

- Atoms wrap Radix primitives behind a consistent `variant` / `size` prop API.
- Build atoms on demand — add one when a screen actually needs it.
- Tailwind v4: theme tokens live in the `@theme` block in `src/index.css`, not a JS config.
- The API client never imports a store; `useAuthStore` hands it a token reader at module load.

## Trade-off to watch

Deep barrel exports can slow Vite's HMR as the app grows. If the dev server gets sluggish,
scope imports to the category level (`@/components/atoms`) instead of the top-level barrel.
