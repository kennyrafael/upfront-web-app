import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout, SignupForm } from '@/components';
import { useCopy } from '@/lib';
import { type BillingCycle, subscriptionsApi } from '@/lib/api';

/**
 * A plan chosen on the marketing site, or nothing.
 *
 * **Portuguese parameter names, because the site is Portuguese** and the address is something a
 * visitor sees. The values are the plan keys, which are not copy — they are what the API and
 * Stripe both call these tiers.
 *
 * Read defensively. `/signup` has to work when somebody types it, and a parameter that arrived
 * mangled, translated or invented must leave the form working rather than break it: an
 * unrecognised plan is dropped here and would be refused by the server anyway, which is the
 * check that counts.
 */
const PLANS = ['free', 'solo', 'standard', 'pro'];

function chosenPlan(value: string | null): string | undefined {
  return value && PLANS.includes(value) ? value : undefined;
}

function chosenCycle(value: string | null): BillingCycle {
  return value === 'year' ? 'year' : 'month';
}

export function SignupPage() {
  const navigate = useNavigate();
  const copy = useCopy();
  const [params] = useSearchParams();

  const plan = chosenPlan(params.get('plano'));
  const cycle = chosenCycle(params.get('ciclo'));

  /**
   * Where a brand-new account goes.
   *
   * Straight to the wizard, not through `/`. An account created a second ago cannot be
   * onboarded, so bouncing off the app shell only bought a "Loading your workspace" spinner on
   * the way — and, when the profile request failed, `RequireOnboarding` fell through to the
   * dashboard and the wizard was skipped entirely.
   *
   * **A chosen plan adds one step and must never add a wall.** Checkout is attempted, and every
   * way it can fail to produce a URL — the free tier, a refusal, a network fault, Stripe not
   * being configured at all — lands in the same place: onboarding, with an account that works.
   * The plan is a hint the provider gave us on a marketing page, not a precondition of having
   * signed up, and treating it as one would strand somebody who has already given us their
   * password.
   */
  async function afterSignup() {
    if (plan) {
      try {
        const { checkoutUrl } = await subscriptionsApi.checkout(plan, cycle);
        if (checkoutUrl) {
          // A full navigation rather than `navigate`: Stripe's hosted page is another origin,
          // and the router would try to match it as a route and render nothing.
          window.location.assign(checkoutUrl);
          return;
        }
      } catch {
        // Deliberately silent here and reported on the other side. There is nowhere good to put
        // an error on a form that has already succeeded, and the wizard can say it plainly.
        navigate('/onboarding?assinatura=cancelada', { replace: true });
        return;
      }
    }

    navigate('/onboarding', { replace: true });
  }

  return (
    <AuthLayout
      title={copy.auth.createTitle}
      subtitle={copy.auth.createSubtitle}
      footer={
        <>
          {copy.auth.haveAccount}{' '}
          <Link to="/login" className="font-medium text-white underline-offset-2 hover:underline">
            {copy.auth.signIn}
          </Link>
        </>
      }
    >
      <SignupForm onSuccess={() => void afterSignup()} />
    </AuthLayout>
  );
}
