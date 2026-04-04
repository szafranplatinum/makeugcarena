'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import UserHeader from '@/components/dashboard/UserHeader';
import { Check, Download, ExternalLink, Loader2 } from 'lucide-react';
import type { PlanConfig } from '@/types';

interface PaymentRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  invoiceUrl?: string;
}

interface UsageData {
  summary: {
    total_earned: number;
    total_spent: number;
    current_balance: number;
  };
}

interface CurrentPlanInfo {
  plan_slug: string;
  plan_name: string;
  current_interval: 'monthly' | 'yearly';
  renewal_date: string;
  credits_monthly: number;
}

const statusColors = {
  completed: 'text-green-700 bg-green-50',
  pending: 'text-yellow-700 bg-yellow-50',
  failed: 'text-red-700 bg-red-50',
};

const statusLabels = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
};

export default function BillingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Data states
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlanInfo | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

  // Loading states
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Error states
  const [plansError, setPlansError] = useState<string | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);

  // Fetch plans on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        setPlansError(null);
        const response = await fetch('/api/billing/plans');

        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }

        const data = await response.json();
        setPlans(data.data || []);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setPlansError(error instanceof Error ? error.message : 'Failed to fetch plans');
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Fetch usage and subscription info on mount
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoadingUsage(true);
        setUsageError(null);

        const usageResponse = await fetch('/api/billing/usage');

        if (!usageResponse.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const usageDataResult = await usageResponse.json();
        setUsageData(usageDataResult.data);
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setUsageError(error instanceof Error ? error.message : 'Failed to fetch usage data');
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsageData();
  }, []);

  // TODO: In a real implementation, fetch current plan info from user profile
  // For now, we'll assume the first non-free plan in the list is the current plan
  useEffect(() => {
    if (plans.length > 0) {
      // This is a placeholder - in production, fetch actual current plan from user profile
      const currentPlanSlug = 'growth'; // This should come from user profile
      const currentPlanData = plans.find(p => p.slug === currentPlanSlug);

      if (currentPlanData) {
        setCurrentPlan({
          plan_slug: currentPlanData.slug,
          plan_name: currentPlanData.name,
          current_interval: selectedInterval,
          renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          credits_monthly: currentPlanData.credits_monthly,
        });
      }
    }
  }, [plans, selectedInterval]);

  const handlePlanUpgrade = async (plan: PlanConfig) => {
    if (!plan.stripe_price_id_monthly && !plan.stripe_price_id_yearly) {
      console.error('No Stripe price ID available for this plan');
      return;
    }

    const priceId = selectedInterval === 'monthly'
      ? plan.stripe_price_id_monthly
      : plan.stripe_price_id_yearly;

    if (!priceId) {
      console.error(`No Stripe price ID available for ${selectedInterval} interval`);
      return;
    }

    try {
      setCheckoutLoading(plan.slug);

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planSlug: plan.slug,
          interval: selectedInterval,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);

      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe customer portal
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const creditsRemaining = usageData?.summary.current_balance ?? 0;
  const renewalDate = currentPlan?.renewal_date
    ? new Date(currentPlan.renewal_date).toLocaleDateString()
    : 'Unknown';

  // Mock payment history - in production, fetch from Stripe
  const mockPayments: PaymentRecord[] = [
    {
      id: '1',
      date: '2024-03-01',
      description: 'Pro Plan - Monthly Subscription',
      amount: 29.99,
      status: 'completed',
      invoiceUrl: '#',
    },
    {
      id: '2',
      date: '2024-02-01',
      description: 'Pro Plan - Monthly Subscription',
      amount: 29.99,
      status: 'completed',
      invoiceUrl: '#',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <UserHeader title={t('billing.title')} />

      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Current Plan Card */}
          {loadingUsage ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentPlan?.plan_name || 'Loading...'}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your subscription renews on <strong>{renewalDate}</strong>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedInterval === 'monthly' ? 'Monthly' : 'Yearly'} Price
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {currentPlan
                          ? `$${selectedInterval === 'monthly' ? (currentPlan.credits_monthly * 0.1).toFixed(2) : (currentPlan.credits_monthly * 0.1 * 10).toFixed(2)}`
                          : '-'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedInterval === 'monthly' ? 'Monthly' : 'Yearly'} Credits
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {currentPlan?.credits_monthly || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Credits Remaining</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {creditsRemaining}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('billing.manageSubscription') || 'Manage'}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade Your Plan
              </h3>

              {/* Interval Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedInterval('monthly')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    selectedInterval === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedInterval('yearly')}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    selectedInterval === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {loadingPlans ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 text-brand-600 animate-spin" />
              </div>
            ) : plansError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
                <p className="font-semibold">Error loading plans</p>
                <p className="text-sm">{plansError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans
                  .filter(plan => plan.slug !== 'free')
                  .map((plan) => {
                    const priceId = selectedInterval === 'monthly'
                      ? plan.stripe_price_id_monthly
                      : plan.stripe_price_id_yearly;
                    const isCurrent = currentPlan?.plan_slug === plan.slug;
                    const isLoading = checkoutLoading === plan.slug;

                    return (
                      <div
                        key={plan.slug}
                        className={`rounded-xl border-2 p-6 transition-all ${
                          plan.is_popular
                            ? 'border-brand-600 bg-brand-50 shadow-lg'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {isCurrent && (
                          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 mb-4">
                            {t('billing.currentPlanBadge') || 'Current Plan'}
                          </div>
                        )}

                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          {plan.name}
                        </h4>
                        <div className="mb-4">
                          <span className="text-4xl font-bold text-gray-900">
                            ${selectedInterval === 'monthly'
                              ? plan.price_monthly
                              : plan.price_yearly
                            }
                          </span>
                          <span className="text-gray-600">
                            /{selectedInterval === 'monthly' ? 'month' : 'year'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                          {plan.credits_monthly} credits
                          {selectedInterval === 'yearly' ? ' /month' : ' /month'}
                        </p>

                        <button
                          onClick={() => handlePlanUpgrade(plan)}
                          disabled={isCurrent || isLoading || !priceId}
                          className={`w-full py-2 rounded-lg font-semibold transition-colors mb-6 flex items-center justify-center gap-2 ${
                            isCurrent
                              ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                              : 'bg-brand-600 text-white hover:bg-brand-700'
                          } ${(isLoading || !priceId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {isCurrent
                            ? (t('billing.currentPlanBadge') || 'Current Plan')
                            : (t('billing.selectPlan') || 'Switch Plan')
                          }
                        </button>

                        <div className="space-y-3">
                          {plan.features.map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 text-sm text-gray-700"
                            >
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment History
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Note: Payment history is currently a placeholder. Real invoices will be available soon.
            </p>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {payment.description}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              statusColors[payment.status]
                            }`}
                          >
                            {statusLabels[payment.status]}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <a
                            href={payment.invoiceUrl}
                            className="text-brand-600 hover:text-brand-700 flex items-center gap-2 font-medium"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cancel Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-8 max-w-sm w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Cancel Subscription?
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel your {currentPlan?.plan_name} Plan subscription? You
                  will lose access to premium features at the end of the billing
                  cycle.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Keep Plan
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
