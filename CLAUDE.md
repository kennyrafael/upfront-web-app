# upfront-web-app

The Upfront provider dashboard. React + Vite, port 5173, deployed to Vercel.

**The product brief, the roadmap and every design document live in the `upfront` repository**,
not here. What Upfront is, who it is for, and which decisions are already closed are all there.
This file covers only what is true about *this* codebase.

## Structure

Atomic design, and **every folder has an `index.ts`** — no exceptions, down to each component
folder. That is what makes `import { Button, Input, FormField } from '@/components'` work.

- **atoms** — Radix Themes components behind the house prop API. The app says
  `variant="danger"`, not `variant="solid" color="red"`, so the house style lives in one file
  per component rather than at sixty call sites.
- **molecules** — two or more atoms composed: `FormField`, `ConfirmDialog`, `Combobox`.
- **organisms** — whole features: `BookingCalendar`, `ComplianceOverview`.
- **layouts** — page shells.

State is Zustand, one store per domain. Lint and format are Biome, not ESLint and Prettier.

## Colour

**Colour comes from Radix Themes, not from us.** `src/index.css` is the bridge, mapping token
names (`brand-700`, `ink-muted`, `surface`) onto Themes' semantic steps (`--accent-9`,
`--gray-11`). Nothing outside that file should name a Radix variable. Those steps mean the same
thing in both appearances, which is why light and dark need no second palette.

Two rules that bite:

- **Adding a colour means adding its scale** to `main.tsx`, which imports only the scales in
  use. A colour whose scale is missing resolves to nothing.
- **Brand text uses `brand-ink`, not `brand-700`.** Step 9 is the block Radix paints buttons
  with; as text it fails WCAG AA for five of the six accents. Step 11 passes for all of them.

## Known traps in the component layer

**`Popover.Anchor` renders nothing in Themes 3.3.0.** Use `Popover.Trigger`, which already
clones its child rather than wrapping it in a button. This silently removed the input from the
client picker, so no booking could be made from the dashboard at all, for an unknown length of
time.

**`@stripe/stripe-js` has no type for `confirmMbWayPayment`** although Stripe documents it.
`src/lib/payments/stripe.ts` carries a deliberately narrow shim that checks the method exists
before calling it. Delete it when the typings catch up.

## Tests

`npm test` — Vitest in jsdom, with Testing Library for the component ones. Started 2026-09-28
after two bugs shipped in one week that a test would have caught, and **the first run found a
third**: clicking the Combobox field wiped what you had typed, because Radix's `Popover.Trigger`
composes `onOpenToggle` onto its child.

Covered so far, chosen as the places where a failure is *silent* rather than by counting files:
the Combobox, the compliance export period, the contrast helpers that keep a provider's booking
page readable in their own brand colour, the calendar grid, and the public page's timezone
maths. Everything else is uncovered — the stores and the organisms especially.

**`src/lib/utils/grid.ts` is duplicated from the API** and its test file is paired with
`api/test/grid-step.test.ts` on purpose: the failure being guarded against is the two copies
drifting, and a test on one side only would not see it.

Meticulous records sessions in every environment except
production; see `vite.config.ts`, where the gate keys on `VERCEL_ENV` alone. **Do not pin that
to a branch name**: the day production moves branches, a branch-pinned gate reads "not
production" and starts recording real clients' sessions.

## Reaching the API

The client always fetches `` `/api${path}` `` on its **own origin** and must keep doing so: the
refresh cookie is `sameSite: lax`, which a browser will not send cross-site. Pointing the
client at the API host would log someone in and then fail to keep them logged in — a worse
failure than a 404, because it looks intermittent.

`vercel.json` rewrites that prefix in deployments and the Vite proxy does it in development.
**The two must not disagree.**
