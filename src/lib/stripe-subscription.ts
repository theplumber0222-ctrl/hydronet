import type Stripe from "stripe";

/** Stripe API typings omit top-level period on Subscription; use first item. */
export function getSubscriptionPeriod(sub: Stripe.Subscription): {
  start: Date;
  end: Date;
} | null {
  const item = sub.items?.data?.[0];
  if (!item) return null;
  return {
    start: new Date(item.current_period_start * 1000),
    end: new Date(item.current_period_end * 1000),
  };
}
