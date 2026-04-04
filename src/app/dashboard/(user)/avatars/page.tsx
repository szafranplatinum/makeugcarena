'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import UserHeader from '@/components/dashboard/UserHeader';
import { Search, Lock } from 'lucide-react';

interface Avatar {
  id: string;
  name: string;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  gender: string;
  ethnicity: string;
  style: string;
  age_range: string;
  languages: string[];
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    data: Avatar[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Skeleton loading component
function AvatarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-gray-300" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-300 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-300 rounded w-16" />
          <div className="h-5 bg-gray-300 rounded w-20" />
        </div>
        <div className="h-9 bg-gray-300 rounded" />
      </div>
    </div>
  );
}

export default function AvatarsPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableGenders, setAvailableGenders] = useState<string[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);

  // Fetch avatars with filters
  const fetchAvatars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
      });

      if (genderFilter) {
        params.append('gender', genderFilter);
      }
      if (styleFilter) {
        params.append('style', styleFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/avatars?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch avatars');
      }

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setAvatars(result.data.data);
        setPagination({
          page: result.data.page,
          pageSize: result.data.pageSize,
          total: result.data.total,
          totalPages: result.data.totalPages,
        });
      }
    } catch (err) {
      console.error('Error fetching avatars:', err);
      setError(err instanceof Error ? err.message : 'Failed to load avatars');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, genderFilter, styleFilter, searchQuery]);

  // Fetch avatars when filters change
  useEffect(() => {
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [genderFilter, styleFilter, searchQuery]);

  // Fetch when pagination or filters update
  useEffect(() => {
    fetchAvatars();
  }, [fetchAvatars]);

  // Extract available filter options from all avatars (fetch once without filters)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/avatars?pageSize=1000');
        if (response.ok) {
          const result: ApiResponse = await response.json();
          const allAvatars = result.data.data;

          const genderSet = new Set(
            allAvatars
              .map((a) => a.gender)
              .filter(Boolean)
          );
          const styleSet = new Set(
            allAvatars
              .map((a) => a.style)
              .filter(Boolean)
          );

          setAvailableGenders(Array.from(genderSet).sort());
          setAvailableStyles(Array.from(styleSet).sort());
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleGenderChange = (gender: string) => {
    setGenderFilter(gender);
  };

  const handleStyleChange = (style: string) => {
    setStyleFilter(style);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePreviousPage = () => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(prev.totalPages, prev.page + 1),
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <UserHeader
        title={t('avatars.title')}
        subtitle={t('avatars.subtitle')}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">All Genders</option>
                {availableGenders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>

              {/* Style Filter */}
              <select
                value={styleFilter}
                onChange={(e) => handleStyleChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">All Styles</option>
                {availableStyles.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-gray-600">
              {loading
                ? 'Loading avatars...'
                : `Showing ${avatars.length} of ${pagination.total} avatars`}
            </p>
          </div>

          {/* Avatars Grid */}
          {error ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-gray-600 font-medium">Error loading avatars</p>
              <p className="text-gray-500 text-sm mt-1">{error}</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <AvatarSkeleton key={i} />
              ))}
            </div>
          ) : avatars.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Avatar Thumbnail */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                      {avatar.thumbnail_url ? (
                        <img
                          src={avatar.thumbnail_url}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {!avatar.thumbnail_url && (
                        <div className="text-5xl">👤</div>
                      )}
                      {avatar.is_premium && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white rounded-full p-2 flex items-center justify-center shadow-lg">
                          <Lock className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Avatar Info */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {avatar.name}
                      </h3>

                      <div className="flex gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {avatar.gender}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {avatar.style}
                        </span>
                      </div>

                      {/* Select Button */}
                      <button
                        onClick={() => setSelectedAvatar(avatar.id)}
                        className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                          selectedAvatar === avatar.id
                            ? 'bg-brand-600 text-white'
                            : avatar.is_premium
                              ? 'bg-gray-100 text-gray-700 cursor-not-allowed opacity-75'
                              : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                        }`}
                        disabled={avatar.is_premium}
                      >
                        {avatar.is_premium ? t('avatars.premium') : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button
                    onClick={handlePreviousPage}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-600 font-medium">No avatars found</p>
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
