'use client';

import { useEffect, useState } from 'react';
import { AIAvatar } from '@/types';
import { apiClient } from '@/lib/api-client';

export interface AvatarFilters {
  gender?: string;
  style?: string;
  search?: string;
  premium?: boolean;
}

export interface UseAvatarsReturn {
  avatars: AIAvatar[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching AI avatars with optional filters
 * @param filters - Optional filters for gender, style, search, and premium status
 * @returns avatars, loading state, error, and refetch function
 */
export function useAvatars(filters?: AvatarFilters): UseAvatarsReturn {
  const [avatars, setAvatars] = useState<AIAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvatars = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {};
      if (filters?.gender) params.gender = filters.gender;
      if (filters?.style) params.style = filters.style;
      if (filters?.search) params.search = filters.search;
      if (filters?.premium !== undefined) params.premium = filters.premium;

      const data = await apiClient.get<AIAvatar[]>('/api/avatars', params);
      setAvatars(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch avatars';
      setError(message);
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, [filters?.gender, filters?.style, filters?.search, filters?.premium]);

  return {
    avatars,
    loading,
    error,
    refetch: fetchAvatars,
  };
}
