/**
 * The atoms, which now live in `@upfront/ui`.
 *
 * **Re-exported rather than removed**, so every `import { Button } from '@/components'` in the
 * app keeps working and the move is one commit instead of one per call site. The folder that
 * used to hold eighteen components holds this file; the components themselves are shared with
 * the marketing site and the admin app, which is the point — `secondary` meant two different
 * things in two apps before this.
 *
 * Anything genuinely specific to the dashboard belongs in `molecules/` or in its own file here,
 * not back in the package. Moving a component into `@upfront/ui` should be a response to a
 * second consumer, not an anticipation of one.
 */
export * from '@upfront/ui';
