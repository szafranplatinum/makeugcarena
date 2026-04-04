'use client';

import { useState, useEffect } from 'react';
import UserHeader from '@/components/dashboard/UserHeader';
import { useI18n } from '@/lib/i18n';
import {
  Film,
  Coins,
  Star,
  Plus,
  Zap,
  Users,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Project {
  id: string;
  title: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  type: string;
  created_at: string;
  duration: string;
  avatar?: {
    id: string;
    name: string;
  };
}

interface UsageDataPoint {
  date: string;
  credits: number;
}

interface DashboardStats {
  videosCreated: number;
  creditsUsed: number;
  creditsRemaining: number;
  activeProjects: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentProjects: Project[];
  usageChart: UsageDataPoint[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {loading ? (
              <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
        </div>
        <div className="h-8 w-8 opacity-20">{Icon}</div>
      </div>
    </div>
  );
}

function ProjectTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [usageData, setUsageData] = useState<UsageDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    videosCreated: 0,
    creditsUsed: 0,
    creditsRemaining: 0,
    activeProjects: 0,
  });
  const { t } = useI18n();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data: DashboardData = await response.json();
      setStats(data.stats);
      setProjects(data.recentProjects || []);
      setUsageData(data.usageChart || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    draft: t('projects.filter.draft'),
    processing: t('projects.filter.processing'),
    completed: t('projects.filter.completed'),
    failed: t('projects.filter.failed'),
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setProjects(projects.filter((p) => p.id !== id));
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete project:', err);
      // Refetch to restore state
      fetchData();
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <UserHeader title={t('dashboard.welcome')} />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
                <p className="text-xs text-red-700 mt-1">
                  {t('dashboard.errorTryAgain')}
                </p>
              </div>
              <button
                onClick={fetchData}
                className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-100"
                title={t('common.retry') || 'Retry'}
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Film className="h-8 w-8 text-brand-600" />}
              label={t('dashboard.videosCreated')}
              value={stats.videosCreated}
              loading={loading}
            />
            <StatCard
              icon={<Coins className="h-8 w-8 text-amber-600" />}
              label={t('dashboard.creditsUsed')}
              value={stats.creditsUsed}
              loading={loading}
            />
            <StatCard
              icon={<Star className="h-8 w-8 text-green-600" />}
              label={t('dashboard.creditsRemaining')}
              value={stats.creditsRemaining}
              loading={loading}
            />
            <StatCard
              icon={<Film className="h-8 w-8 text-purple-600" />}
              label={t('dashboard.activeProjects')}
              value={stats.activeProjects}
              loading={loading}
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.quickActions')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/create">
                <button className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-5 w-5" />
                  {t('dashboard.createNewVideo')}
                </button>
              </Link>

              <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                {t('dashboard.generateWithAI')}
              </button>

              <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {t('dashboard.browseAvatars')}
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.recentProjects')}
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {loading ? (
                <div className="p-8">
                  <ProjectTableSkeleton />
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <Film className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium mb-4">
                    {t('dashboard.noProjects')}
                  </p>
                  <Link href="/dashboard/create">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition-colors">
                      <Plus className="h-4 w-4" />
                      {t('dashboard.createNewVideo')}
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {t('dashboard.title')}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {t('dashboard.type')}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {t('dashboard.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {t('dashboard.duration')}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {t('dashboard.date')}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          {t('dashboard.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr
                          key={project.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {project.title}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {project.type}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                statusColors[project.status]
                              }`}
                            >
                              {statusLabels[project.status]}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {project.duration}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {formatDate(project.created_at)}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                title={t('common.view')}
                                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="h-4 w-4 text-gray-600" />
                              </button>
                              {project.status === 'completed' && (
                                <button
                                  title={t('dashboard.download')}
                                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  <Download className="h-4 w-4 text-gray-600" />
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Usage Chart */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.usageAnalytics')}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('dashboard.trackMetrics')}
            </p>
            {loading ? (
              <div className="h-80 bg-gray-50 rounded-lg animate-pulse" />
            ) : usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={usageData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value) => [value, 'Credits Used']}
                    labelStyle={{ color: '#111827' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCredits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('dashboard.usageChartComing')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
