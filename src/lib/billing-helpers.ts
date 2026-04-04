/**
 * Billing and Subscription Helper Functions
 * Utility functions for common billing operations
 */

import type {
  SubscriptionPlan,
  SubscriptionStatus,
  UserProfile,
  PlanConfig,
} from '@/types';

/**
 * Check if user has an active subscription
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Check if user is on a paid plan
 */
export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan !== 'free';
}

/**
 * Check if user can perform an action based on credits
 */
export function hasEnoughCredits(
  creditsRemaining: number,
  creditsNeeded: number
): boolean {
  return creditsRemaining >= creditsNeeded;
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  const statusLabels: Record<SubscriptionStatus, string> = {
    active: 'Active',
    canceled: 'Canceled',
    past_due: 'Payment Due',
    trialing: 'Trial Period',
    expired: 'Expired',
  };
  return statusLabels[status] || status;
}

/**
 * Get status badge color for subscription
 */
export function getStatusColor(status: SubscriptionStatus): string {
  const colors: Record<SubscriptionStatus, string> = {
    active: 'bg-green-100 text-green-700',
    canceled: 'bg-gray-100 text-gray-700',
    past_due: 'bg-red-100 text-red-700',
    trialing: 'bg-blue-100 text-blue-700',
    expired: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/**
 * Calculate credits remaining percentage
 */
export function getCreditsPercentage(
  creditsRemaining: number,
  creditsMonthly: number
): number {
  if (creditsMonthly === 0) return 0;
  return Math.min(100, (creditsRemaining / creditsMonthly) * 100);
}

/**
 * Check if subscription renewal is coming up
 */
export function isRenewalSoon(daysUntilRenewal: number = 7): boolean {
  return daysUntilRenewal <= 7;
}

/**
 * Format plan name for display
 */
export function formatPlanName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    free: 'Free',
    startup: 'Startup',
    growth: 'Growth',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  return names[plan] || plan;
}

/**
 * Get plan features from config
 */
export function getPlanFeatures(planConfig: PlanConfig | null): string[] {
  return planConfig?.features || [];
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate annual savings for yearly plan
 */
export function calculateAnnualSavings(
  monthlyPrice: number,
  yearlyPrice: number
): number {
  const monthlyAnnual = monthlyPrice * 12;
  return Math.max(0, monthlyAnnual - yearlyPrice);
}

/**
 * Calculate savings percentage
 */
export function calculateSavingsPercentage(
  monthlyPrice: number,
  yearlyPrice: number
): number {
  const monthlyAnnual = monthlyPrice * 12;
  if (monthlyAnnual === 0) return 0;
  return Math.round(((monthlyAnnual - yearlyPrice) / monthlyAnnual) * 100);
}

/**
 * Determine if plan upgrade is available
 */
export function canUpgrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan
): boolean {
  const planHierarchy: Record<SubscriptionPlan, number> = {
    free: 0,
    startup: 1,
    growth: 2,
    pro: 3,
    enterprise: 4,
  };

  return planHierarchy[targetPlan] > planHierarchy[currentPlan];
}

/**
 * Determine if plan downgrade is available
 */
export function canDowngrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan
): boolean {
  const planHierarchy: Record<SubscriptionPlan, number> = {
    free: 0,
    startup: 1,
    growth: 2,
    pro: 3,
    enterprise: 4,
  };

  return planHierarchy[targetPlan] < planHierarchy[currentPlan];
}

/**
 * Get credits warning threshold percentage
 */
export function getCreditsWarningThreshold(): number {
  return 20; // Warn when below 20% of monthly allocation
}

/**
 * Check if user should be warned about low credits
 */
export function shouldWarnAboutLowCredits(
  creditsRemaining: number,
  creditsMonthly: number
): boolean {
  const threshold = getCreditsWarningThreshold();
  const percentage = getCreditsPercentage(creditsRemaining, creditsMonthly);
  return percentage <= threshold;
}

/**
 * Get estimated credit renewal date
 * (assuming monthly billing on same day)
 */
export function getEstimatedRenewalDate(
  currentDate: Date = new Date(),
  billingDay: number = 1
): Date {
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(billingDay);
  return nextMonth;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get days until date
 */
export function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if trial period is active
 */
export function isTrialPeriodActive(status: SubscriptionStatus): boolean {
  return status === 'trialing';
}

/**
 * Get retry billing message for past_due status
 */
export function getPastDueMessage(): string {
  return 'Your payment could not be processed. Please update your payment method in the billing portal.';
}

/**
 * Build checkout params for API call
 */
export function buildCheckoutParams(
  priceId: string,
  planSlug: SubscriptionPlan,
  interval: 'monthly' | 'yearly'
) {
  return {
    priceId,
    planSlug,
    interval,
  };
}

/**
 * Check if user needs to accept new terms before purchase
 */
export function needsTermsAcceptance(lastAcceptedAt: string | null): boolean {
  if (!lastAcceptedAt) return true;

  // Consider terms accepted if within last 1 year
  const lastAccepted = new Date(lastAcceptedAt);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return lastAccepted < oneYearAgo;
}

/**
 * Get plan comparison info
 */
export function getPlanComparison(
  plan1: PlanConfig,
  plan2: PlanConfig
): {
  features: {
    plan1: boolean;
    plan2: boolean;
    feature: string;
  }[];
} {
  const allFeatures = new Set([
    ...plan1.features,
    ...plan2.features,
  ]);

  const comparison = {
    features: Array.from(allFeatures).map((feature) => ({
      feature,
      plan1: plan1.features.includes(feature),
      plan2: plan2.features.includes(feature),
    })),
  };

  return comparison;
}

/**
 * Get credit transaction description for display
 */
export function getTransactionDescription(
  action: string,
  description: string | null
): string {
  if (description) return description;

  const actionLabels: Record<string, string> = {
    talking_head: 'Talking Head Video',
    hook_video: 'Hook Video',
    product_demo: 'Product Demo',
    broll: 'B-roll Generation',
    script_gen: 'AI Script Generation',
    image_gen: 'Image Generation',
    subscription_renewal: 'Subscription Renewal',
    admin_adjustment: 'Admin Adjustment',
    purchase: 'Plan Purchase',
  };

  return actionLabels[action] || action;
}

/**
 * Calculate monthly burn rate
 */
export function calculateMonthlyBurnRate(
  creditsUsedInPeriod: number,
  daysInPeriod: number
): number {
  if (daysInPeriod === 0) return 0;
  return (creditsUsedInPeriod / daysInPeriod) * 30; // Normalize to 30 days
}

/**
 * Estimate days of credits remaining
 */
export function estimateDaysRemaining(
  creditsRemaining: number,
  monthlyBurnRate: number
): number {
  if (monthlyBurnRate === 0) return Infinity;
  return Math.ceil((creditsRemaining / monthlyBurnRate) * 30);
}
