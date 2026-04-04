'use client';

import { useEffect, useState } from 'react';
import { PlanConfig, CreditTransaction } from '@/types';
import { apiClient, ApiError } from '@/lib/api-client';

export type BillingPeriod = '7d' | '30d' | '90d';

export interface UseBillingReturn {
  plans: PlanConfig[];
  currentPlan: PlanConfig | null;
  loading: boolean;
  error: string | null;
  createCheckout: (priceId: string, planSlug: string, interval: 'monthly' | 'yearly') => Promise<void>;
  openPortal: () => Promise<void>;
  usage: CreditTransaction[];
  usageLoading: boolean;
  fetchUsage: (period: BillingPeriod) => Promise<void>;
}

/**
 * Hook for managing billing, plans, and credit usage
 * @returns plans, currentPlan, loading, error, checkout/portal methods, and usage data
 */
export function useBilling(): UseBillingReturn {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<CreditTransaction[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);

  // Fetch plans and current subscription on mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        const [plansData, currentPlanData] = await Promise.all([
          apiClient.get<PlanConfig[]>('/api/billing/plans'),
          apiClient.get<PlanConfig | null>('/api/billing/current-plan').catch(() => null),
        ]);

        setPlans(plansData);
        setCurrentPlan(currentPlanData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch plans';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const createCheckout = async (priceId: string, planSlug: string, interval: 'monthly' | 'yearly') => {
    try {
      setError(null);

      const response = await apiClient.post<{ redirectUrl: string }>('/api/billing/checkout', {
        priceId,
        planSlug,
        interval,
      });

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(message);
      throw err;
    }
  };

  const openPortal = async () => {
    try {
      setError(null);

      const response = await apiClient.post<{ redirectUrl: string }>('/api/billing/portal');

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open billing portal';
      setError(message);
      throw err;
    }
  };

  const fetchUsage = async (period: BillingPeriod) => {
    try {
      setUsageLoading(true);
      setError(null);

      const data = await apiClient.get<CreditTransaction[]>('/api/billing/usage', { period });
      setUsage(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch usage data';
      setError(message);
    } finally {
      setUsageLoading(false);
    }
  };

  return {
    plans,
    currentPlan,
    loading,
    error,
    createCheckout,
    openPortal,
    usage,
    usageLoading,
    fetchUsage,
  };
}
