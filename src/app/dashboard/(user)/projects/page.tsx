'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import UserHeader from '@/components/dashboard/UserHeader';
import {
  Search,
  Download,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  type: string;
  created_at: string;
}

interface ApiResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

function ProjectSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="w-full h-40 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
        <div className="flex gap-2 pt-2">
          <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [projectTypes, setProjectTypes] = useState<string[]>(['All']);

  // Fetch projects from API
  const fetchProjects = async (pageNum: number = 1, statusValue?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusValue && statusValue !== 'All') {
        params.append('status', statusValue.toLowerCase());
      }

      const response = await fetch(`/api/videos?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const result: ApiResponse = await response.json();
      setProjects(result.data);
      setTotal(result.total);
      setPage(result.page);

      // Extract unique types for filter dropdown
      const uniqueTypes = Array.from(
        new Set(result.data.map((p) => p.type))
      );
      setProjectTypes(['All', ...uniqueTypes]);

      // Apply local filters
      applyFilters(result.data, searchQuery, statusValue || statusFilter, typeFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply local filters to projects
  const applyFilters = (
    projectsToFilter: Project[],
    query: string,
    status: string,
    type: string
  ) => {
    const filtered = projectsToFilter.filter((project) => {
      const matchesSearch = project.title
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        status === 'All' || project.status === status.toLowerCase();
      const matchesType = type === 'All' || project.type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
    setFilteredProjects(filtered);
  };

  // Initial load
  useEffect(() => {
    fetchProjects(1);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPage(1);
    fetchProjects(1, newStatus);
  };

  // Handle search input change (local filtering)
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(projects, query, statusFilter, typeFilter);
  };

  // Handle type filter change (local filtering)
  const handleTypeFilterChange = (newType: string) => {
    setTypeFilter(newType);
    applyFilters(projects, searchQuery, statusFilter, newType);
  };

  // Delete project
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Refresh the projects list
      fetchProjects(page, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: t('projects.filter.draft'),
      processing: t('projects.filter.processing'),
      completed: t('projects.filter.completed'),
      failed: t('projects.filter.failed'),
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <UserHeader title={t('projects.title')} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option>All</option>
                <option>{t('projects.filter.draft')}</option>
                <option>{t('projects.filter.processing')}</option>
                <option>{t('projects.filter.completed')}</option>
                <option>{t('projects.filter.failed')}</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {!isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>
                  Showing {filteredProjects.length} of {total} projects
                </span>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectSkeleton key={i} />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail Placeholder */}
                  <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎬</div>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {project.title}
                    </h3>

                    <div className="flex items-center justify-between text-sm">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {project.type}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          statusColors[project.status]
                        }`}
                      >
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      {formatDate(project.created_at)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        title={t('common.view')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors font-medium text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        {t('common.view')}
                      </button>
                      {project.status === 'completed' && (
                        <button
                          title={t('dashboard.download')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          <Download className="h-4 w-4" />
                          {t('dashboard.download')}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(project.id)}
                        title={t('common.delete')}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-600 font-medium">{t('projects.noProjects')}</p>
              <p className="text-gray-500 text-sm mt-1">
                {t('projects.noProjectsDesc')}
              </p>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && total > pageSize && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => fetchProjects(page - 1, statusFilter)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <button
                onClick={() => fetchProjects(page + 1, statusFilter)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
