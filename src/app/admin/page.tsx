import AdminHeader from '@/components/admin/AdminHeader';
import {
  Users,
  Film,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
};

const planColorMap: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  startup: 'bg-blue-100 text-blue-700',
  growth: 'bg-purple-100 text-purple-700',
  pro: 'bg-amber-100 text-amber-700',
  enterprise: 'bg-red-100 text-red-700',
};

const statusColorMap: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-700',
};

function formatJoinedDate(createdAt: string): string {
  try {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch {
    return createdAt;
  }
}

export default async function AdminDashboardPage() {
  const supabase = createAdminSupabaseClient();

  // Parallel fetch all data directly from Supabase
  const [
    usersResult,
    videosCountResult,
    recentUsersResult,
    recentVideosResult,
  ] = await Promise.all([
    supabase.from('user_profiles').select('id, plan, stripe_subscription_id', { count: 'exact' }),
    supabase.from('video_projects').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_profiles')
      .select('id, full_name, email, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('video_projects')
      .select('id, title, status, type, created_at, user_id, user:user_profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const allUsers = usersResult.data || [];
  const totalUsers = usersResult.count || allUsers.length;
  const totalVideos = videosCountResult.count || 0;
  const activeSubscribers = allUsers.filter((u) => u.plan !== 'free').length;
  const totalRevenue = allUsers.filter(
    (u) => u.plan !== 'free' && u.stripe_subscription_id
  ).length * 100; // Placeholder calculation

  const recentUsers = recentUsersResult.data || [];
  const recentVideos = (recentVideosResult.data || []) as Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    created_at: string;
    user_id: string;
    user: { full_name: string | null } | null;
  }>;

  const stats = [
    {
      label: '总用户数',
      value: totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue',
    },
    {
      label: '生成视频数',
      value: totalVideos.toLocaleString(),
      change: '+23.1%',
      trend: 'up' as const,
      icon: Film,
      color: 'purple',
    },
    {
      label: '活跃订阅',
      value: activeSubscribers.toLocaleString(),
      change: '+8.3%',
      trend: 'up' as const,
      icon: CreditCard,
      color: 'green',
    },
    {
      label: '总收入',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '-2.1%',
      trend: 'down' as const,
      icon: TrendingUp,
      color: 'amber',
    },
  ];

  return (
    <div>
      <AdminHeader title="仪表盘" userName="超级管理员" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">最近注册用户</h2>
              <a href="/admin/users" className="text-sm text-brand-600 hover:text-brand-700">
                查看全部
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          planColorMap[user.plan?.toLowerCase()] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.plan}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatJoinedDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  暂无用户数据
                </div>
              )}
            </div>
          </div>

          {/* Recent Videos */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">最近生成视频</h2>
              <a href="/admin/videos" className="text-sm text-brand-600 hover:text-brand-700">
                查看全部
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentVideos.length > 0 ? (
                recentVideos.map((video) => (
                  <div key={video.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{video.title}</div>
                      <div className="text-xs text-gray-500">
                        - {video.user?.full_name || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 capitalize">{video.type?.replace('_', ' ')}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          statusColorMap[video.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {video.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  暂无视频数据
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
