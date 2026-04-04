'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { TrendingUp, Users, Video, Zap } from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const planColors = {
  free: '#EF4444',
  startup: '#3B82F6',
  growth: '#A855F7',
  pro: '#F59E0B',
  enterprise: '#10B981',
};

interface OverviewStats {
  total_users: number;
  active_subscribers: number;
  total_videos: number;
  videos_in_period: number;
  new_users: number;
  total_revenue: number;
  credits_consumed: number;
}

interface DailySignup {
  date: string;
  count: number;
}

interface DailyVideo {
  date: string;
  count: number;
}

interface PlanDistributionItem {
  plan: string;
  count: number;
}

interface TopUser {
  user: string;
  videos_count: number;
  credits_used: number;
}

interface AnalyticsResponse {
  success: boolean;
  data: {
    overview: OverviewStats;
    daily_signups: DailySignup[];
    daily_videos: DailyVideo[];
    plan_distribution: PlanDistributionItem[];
    top_users: TopUser[];
    period: string;
  };
}

interface SkeletonLoaderProps {
  height?: string;
}

function SkeletonLoader({ height = 'h-64' }: SkeletonLoaderProps) {
  return (
    <div className={`${height} bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse`} />
  );
}

function PeriodDisplayLabel(period: string): string {
  switch (period) {
    case '7d':
      return '7 天';
    case '30d':
      return '30 天';
    case '90d':
      return '90 天';
    default:
      return '7 天';
  }
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse['data'] | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/analytics?period=${period}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: AnalyticsResponse = await response.json();
        setAnalyticsData(data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (error) {
    return (
      <div>
        <AdminHeader title="数据分析" userName="超级管理员" />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              <span className="font-medium">错误：</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="数据分析" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 天' },
            { value: '30d', label: '30 天' },
            { value: '90d', label: '90 天' },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setPeriod(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === btn.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">总收入</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 rounded mt-1 animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    ${(analyticsData?.overview.total_revenue || 0).toLocaleString()}
                  </h3>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">-</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* New Users */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">新增用户</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 rounded mt-1 animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {analyticsData?.overview.new_users || 0}
                  </h3>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">-</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Videos Generated */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">生成视频数</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 rounded mt-1 animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {analyticsData?.overview.videos_in_period || 0}
                  </h3>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">-</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">总用户数</p>
                {loading ? (
                  <div className="h-8 w-24 bg-gray-200 rounded mt-1 animate-pulse" />
                ) : (
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {analyticsData?.overview.total_users || 0}
                  </h3>
                )}
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-600">-</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Signups Chart */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">日新增用户</h3>
              <p className="text-sm text-gray-600 mt-1">最近 {PeriodDisplayLabel(period)}</p>
            </div>
            {loading ? (
              <SkeletonLoader height="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.daily_signups || []}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, '新增用户']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSignups)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Daily Video Generations Chart */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">视频生成数</h3>
              <p className="text-sm text-gray-600 mt-1">最近 {PeriodDisplayLabel(period)}</p>
            </div>
            {loading ? (
              <SkeletonLoader height="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData?.daily_videos || []}>
                  <defs>
                    <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [value, '生成视频']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVideos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Credits Consumed */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">积分消费</h3>
            <p className="text-sm text-gray-600 mt-1">最近 {PeriodDisplayLabel(period)}</p>
          </div>
          {loading ? (
            <SkeletonLoader height="h-64" />
          ) : (
            <div className="p-6 text-center text-gray-600">
              <p className="text-lg font-semibold">总计: {analyticsData?.overview.credits_consumed || 0} 积分</p>
            </div>
          )}
        </div>

        {/* Plan Distribution & Top Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Distribution - Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">套餐分布</h3>
            {loading ? (
              <SkeletonLoader height="h-80" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.plan_distribution.map((item) => ({
                        name: item.plan,
                        value: item.count,
                      })) || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(analyticsData?.plan_distribution || []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(planColors)[index] || '#CCCCCC'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-6">
                  {analyticsData?.plan_distribution.map((item, idx) => (
                    <div key={item.plan} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: Object.values(planColors)[idx] || '#CCCCCC' }}
                      />
                      <span className="text-sm text-gray-600">
                        {item.plan} ({item.count.toLocaleString()})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top Users */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Users by Videos</h3>
            </div>
            {loading ? (
              <div className="p-6">
                <SkeletonLoader height="h-40" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">排名</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">用户</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">视频</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">已用积分</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(analyticsData?.top_users || []).map((user, idx) => (
                      <tr key={`${user.user}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">{idx + 1}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{user.user}</td>
                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">{user.videos_count}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{user.credits_used.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">提示：</span> 所有数据均从 /api/admin/analytics API 实时获取，支持 7/30/90 天周期切换。
          </p>
        </div>
      </div>
    </div>
  );
}
