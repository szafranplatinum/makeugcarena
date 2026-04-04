import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Helper: Verify admin role
async function verifyAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use admin client to bypass RLS recursion
  const adminDb = createAdminSupabaseClient();
  const { data: profile } = await adminDb
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) return null;
  return user;
}

function getDateRange(period: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    default:
      from.setDate(from.getDate() - 7);
  }

  return { from, to };
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '7d';

    const supabase = createAdminSupabaseClient();
    const { from, to } = getDateRange(period);
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    // 1. Get overview stats
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('id, plan', { count: 'exact' });

    const totalUsers = allUsers?.length || 0;
    const activeSubscribers = (allUsers || []).filter(
      (u) => u.plan !== 'free'
    ).length;

    // 2. Get total videos generated (all time and in period)
    const { count: totalVideos } = await supabase
      .from('video_projects')
      .select('*', { count: 'exact' });

    const { count: videosInPeriod } = await supabase
      .from('video_projects')
      .select('*', { count: 'exact' })
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

    // 3. Get new users in period
    const { count: newUsersCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

    // 4. Get total revenue (sum of paid plans)
    const { data: subscriptions } = await supabase
      .from('user_profiles')
      .select('plan, stripe_subscription_id');

    const totalRevenue = ((subscriptions || []).filter(
      (u) => u.plan !== 'free' && u.stripe_subscription_id
    ).length) * 100; // Placeholder calculation

    // 5. Get daily signups for chart
    const { data: dailySignups } = await supabase
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

    const signupsByDate: Record<string, number> = {};
    (dailySignups || []).forEach((user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    const dailySignupsChart = Object.entries(signupsByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // 6. Get daily videos for chart
    const { data: dailyVideos } = await supabase
      .from('video_projects')
      .select('created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

    const videosByDate: Record<string, number> = {};
    (dailyVideos || []).forEach((video) => {
      const date = new Date(video.created_at).toISOString().split('T')[0];
      videosByDate[date] = (videosByDate[date] || 0) + 1;
    });

    const dailyVideosChart = Object.entries(videosByDate).map(([date, count]) => ({
      date,
      count,
    }));

    // 7. Get plan distribution
    const planDistribution = {
      free: 0,
      startup: 0,
      growth: 0,
      pro: 0,
      enterprise: 0,
    };

    (allUsers || []).forEach((user) => {
      const plan = user.plan as keyof typeof planDistribution;
      if (plan in planDistribution) {
        planDistribution[plan]++;
      }
    });

    const planDistributionChart = Object.entries(planDistribution).map(
      ([plan, count]) => ({
        plan,
        count,
      })
    );

    // 8. Get top users by videos created
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, full_name, email');

    const topUsersData = await Promise.all(
      (users || []).map(async (user) => {
        const { count: videoCount } = await supabase
          .from('video_projects')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        const { data: credits } = await supabase
          .from('credit_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .lt('amount', 0);

        const creditsUsed = Math.abs(
          (credits || []).reduce((sum, tx) => sum + tx.amount, 0)
        );

        return {
          user: user.full_name || user.email,
          videos_count: videoCount || 0,
          credits_used: creditsUsed,
        };
      })
    );

    const topUsers = topUsersData
      .filter((u) => u.videos_count > 0)
      .sort((a, b) => b.videos_count - a.videos_count)
      .slice(0, 10);

    // 9. Get credits consumed in period
    const { data: periodTransactions } = await supabase
      .from('credit_transactions')
      .select('amount')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .lt('amount', 0);

    const creditsConsumedToday = Math.abs(
      (periodTransactions || []).reduce((sum, tx) => sum + tx.amount, 0)
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_users: totalUsers,
          active_subscribers: activeSubscribers,
          total_videos: totalVideos || 0,
          videos_in_period: videosInPeriod || 0,
          new_users: newUsersCount || 0,
          total_revenue: totalRevenue,
          credits_consumed: creditsConsumedToday,
        },
        daily_signups: dailySignupsChart,
        daily_videos: dailyVideosChart,
        plan_distribution: planDistributionChart,
        top_users: topUsers,
        period,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
