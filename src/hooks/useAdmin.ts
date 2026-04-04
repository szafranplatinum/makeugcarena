'use client';

import { useEffect, useState } from 'react';
import { UserProfile, AdminStats, PaginatedResponse } from '@/types';
import { apiClient } from '@/lib/api-client';

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface AdminUser extends UserProfile {
  videos_count?: number;
  total_credits_used?: number;
}

export interface AnalyticsData {
  stats: AdminStats;
  dailySignups: Array<{ date: string; count: number }>;
  dailyVideos: Array<{ date: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
  topUsers: Array<{
    id: string;
    email: string;
    videos_count: number;
  }>;
}

export interface AdminSettings {
  site_name: string;
  logo_url: string;
  default_credits_monthly: number;
  max_video_duration: number;
  enable_beta_features: boolean;
  stripe_public_key: string;
  email_notifications_enabled: boolean;
  maintenance_mode: boolean;
  [key: string]: unknown;
}

export interface UseAdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  role?: string;
}

export interface UseAdminUsersReturn {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  updateUser: (userId: string, data: Partial<AdminUser>) => Promise<AdminUser>;
  refetch: () => Promise<void>;
}

export interface UseAdminAnalyticsReturn {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseAdminSettingsReturn {
  settings: AdminSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateSettings: (data: Partial<AdminSettings>) => Promise<AdminSettings>;
}

/**
 * Hook for fetching and managing admin users with pagination and filters
 */
export function useAdminUsers(params?: UseAdminUsersParams): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params?.page || 1);
  const [pageSize, setPageSize] = useState(params?.pageSize || 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, unknown> = {
        page,
        pageSize,
      };

      if (params?.search) queryParams.search = params.search;
      if (params?.plan) queryParams.plan = params.plan;
      if (params?.role) queryParams.role = params.role;

      const data = await apiClient.get<PaginatedResponse<AdminUser>>('/api/admin/users', queryParams);

      setUsers(data.data);
      setTotal(data.total);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, params?.search, params?.plan, params?.role]);

  const updateUser = async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    try {
      setError(null);

      const updated = await apiClient.patch<AdminUser>(`/api/admin/users/${userId}`, data);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...updated } : user,
        ),
      );

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      throw err;
    }
  };

  return {
    users,
    total,
    page,
    pageSize,
    loading,
    error,
    updateUser,
    refetch: fetchUsers,
  };
}

/**
 * Hook for fetching admin analytics data
 */
export function useAdminAnalytics(period: AnalyticsPeriod): UseAdminAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const analyticsData = await apiClient.get<AnalyticsData>('/api/admin/analytics', { period });
      setData(analyticsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

/**
 * Hook for managing admin settings
 */
export function useAdminSettings(): UseAdminSettingsReturn {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiClient.get<AdminSettings>('/api/admin/settings');
        setSettings(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch settings';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (data: Partial<AdminSettings>): Promise<AdminSettings> => {
    try {
      setSaving(true);
      setError(null);

      const updated = await apiClient.patch<AdminSettings>('/api/admin/settings', data);
      setSettings(updated);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    error,
    updateSettings,
  };
}
