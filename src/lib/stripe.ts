import Stripe from 'stripe';
import type { SubscriptionPlan } from '@/types';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Get Stripe client instance
export function getStripeClient() {
  return stripe;
}

// Map plan slugs to Stripe price IDs
export const PLAN_PRICE_MAP: Record<
  SubscriptionPlan,
  { monthly: string | null; yearly: string | null }
> = {
  free: { monthly: null, yearly: null },
  startup: {
    monthly: process.env.STRIPE_PRICE_STARTUP_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_STARTUP_YEARLY || '',
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || '',
  },
};

// Reverse map: price ID to plan slug and interval
export function getPriceIdInfo(priceId: string): {
  plan: SubscriptionPlan;
  interval: 'monthly' | 'yearly';
} | null {
  for (const [plan, prices] of Object.entries(PLAN_PRICE_MAP)) {
    if (prices.monthly === priceId) {
      return { plan: plan as SubscriptionPlan, interval: 'monthly' };
    }
    if (prices.yearly === priceId) {
      return { plan: plan as SubscriptionPlan, interval: 'yearly' };
    }
  }
  return null;
}
