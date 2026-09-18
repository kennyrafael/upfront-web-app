import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
/**
 * Radix Themes, assembled by hand rather than taken whole from `styles.css`.
 *
 * That file carries all twenty-six colour scales, in light and dark, solid and alpha. The
 * app uses four. The rest is a public booking page making clients download palettes nothing
 * on the page can refer to — and they are the ones loading it on a phone, on data, having
 * never heard of us. Worth 24 kB gzipped off every first load.
 *
 * **The order is load-bearing, and getting it wrong fails quietly.** Scales define
 * `--gray-*` literally; `base.css` remaps it onto the chosen `grayColor` with
 * `.radix-themes:where([data-gray-color='sage'])`. Both selectors have the same
 * specificity, so whichever is imported last wins — put `base.css` first and the greys go
 * back to plain gray with nothing broken enough to notice. `styles.css` orders it this way
 * for the same reason.
 *
 * **Adding `accentColor`, `grayColor` or `color="…"` anywhere means adding its scale here**,
 * or the component renders against variables that resolve to nothing. The public page is
 * not a case of that: it overrides `--accent-1` through `-12` with the provider's own hex,
 * so it needs no scale of its own.
 */
// The default accent, the neutral beside it, and the literal `--gray-*` that neutral
// remaps. `jade` earns its place twice over: it is also `--color-good`, which stays green
// whatever accent a business picks.
import '@radix-ui/themes/tokens/colors/jade.css';
import '@radix-ui/themes/tokens/colors/sage.css';
import '@radix-ui/themes/tokens/colors/gray.css';
// Danger and warning, which are meanings rather than decoration and never follow the accent.
import '@radix-ui/themes/tokens/colors/red.css';
import '@radix-ui/themes/tokens/colors/amber.css';
// The other accents a business can choose — see `ACCENTS` in lib/utils/theme.ts, which this
// list must match. Four scales for six choices, since jade and red are already here.
import '@radix-ui/themes/tokens/colors/blue.css';
import '@radix-ui/themes/tokens/colors/purple.css';
import '@radix-ui/themes/tokens/colors/orange.css';
import '@radix-ui/themes/tokens/colors/yellow.css';
// Everything that is not a scale — spacing, radii, shadows, type — and the accent and gray
// mappings, which must land after the scales they point at.
import '@radix-ui/themes/tokens/base.css';
import '@radix-ui/themes/components.css';
import '@radix-ui/themes/utilities.css';
// Last: ours redefines a handful of these variables and has to win.
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
