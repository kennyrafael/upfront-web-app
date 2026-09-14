# Upfront Web

React + Vite frontend.

## Structure

```
src/
  components/
    atoms/        Button, Input, Textarea, Label, Select, Switch, Badge, Spinner, Card, Dialog
    molecules/    FormField, SelectField, TextareaField, FieldMessage, ConfirmDialog
    organisms/    LoginForm, SignupForm, ProviderProfileForm, ProviderOnboardingForm,
                  WorkingHoursEditor, ServiceCatalogTable, ServiceFormDialog,
                  ClientTable, ClientFormDialog, BookingCalendar, BookingFormDialog,
                  ComplianceOverview, InvoiceTable, InvoiceFormDialog, ReciboPreview
    layouts/      AuthLayout, DashboardLayout
  lib/
    api/          fetch client + typed endpoint wrappers per domain
    utils/        cn(), money/duration formatting, calendar date maths
  pages/          route-level screens
  routes/         router, auth guard, onboarding gate
  stores/         Zustand stores, one per domain
```

Every folder has an `index.ts`, so imports read as `import { Button } from '@/components'`.

Scaffold a new component rather than creating the three files by hand:

```bash
npm run gen:component -- Popover atoms
```

## Theme

Dark pine green (`--color-brand-*`, primary is `brand-700`) over a faintly green-washed
canvas, with translucent surfaces. Tokens live in the `@theme` block in `src/index.css` —
Tailwind v4 has no JS config.

- `panel` is the shared surface utility: translucent white, hairline ring, soft shadow.
  Use `Card` rather than re-applying it by hand.
- Hairlines and shadows are green-tinted (`--color-hairline`), not neutral grey, so
  stacked translucent layers read as one material.
- Auth screens invert: a deep green field behind a near-opaque white card.

## Conventions

- Atoms wrap Radix primitives behind a consistent `variant` / `size` prop API.
- Build atoms on demand — add one when a screen actually needs it.
- Money is handled in cents end to end; `amountToCents` / `formatMoney` convert at the edges.
- The API client never imports a store; `useAuthStore` hands it a token reader at module load.
- Sign-out calls `resetDomainStores()` so the next account never sees the previous one's data.

## Calendar

`BookingCalendar` is a week grid: 7 day columns, absolutely positioned blocks, 30-minute
click targets for booking an empty gap. Two things it gets deliberately right:

- The visible hour band is derived from the working week **widened to cover any booking
  outside it**, so an out-of-hours appointment is never invisible.
- Working hours are tinted (`bg-brand-700/8`), not lightened. The panel is already
  near-white, so a lighter band disappeared against it.

**Timezone caveat:** the grid renders in the browser's local timezone, while the API
validates working hours in the provider's stored timezone. Those agree for a provider
working from their own machine in their own country. Rendering in the provider's zone
needs a tz-aware date library — do that before any multi-timezone use.

## Trade-offs to watch

Deep barrel exports can slow Vite's HMR as the app grows. If the dev server gets sluggish,
scope imports to the category level (`@/components/atoms`) instead of the top-level barrel.

A long-running dev server can also cache a barrel as empty if it reads the file mid-write;
the symptom is `does not provide an export named 'X'` for a file that looks fine on disk.
Restart the dev server — and check nothing stale is still holding the port.
