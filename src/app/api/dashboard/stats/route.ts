import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { VideoProject, AIAvatar } from '@/types';

export const runtime = 'nodejs';

interface RecentProject {
  id: string;
  title: string;
  status: string;
  type: string;
  duration: number | null;
  created_at: string;
  avatar?: {
    name: string;
    thumbnail_url: string;
  };
}

interface UsageChartData {
  date: string;
  amount: number;
}

interface DashboardStats {
  videosCreated: number;
  creditsUsed: number;
  creditsRemaining: number;
  activeProjects: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentProjects: RecentProject[];
  usageChart: UsageChartData[];
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminSupabaseClient();

    // 1. Get user profile for credits_remaining
    const { data: userProfile, error: profileError } = await adminSupabase
      .from('user_profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    // 2. Count total videos created
    const { count: videosCreatedCount, error: videosError } = await adminSupabase
      .from('video_projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (videosError) {
      console.error('Error counting videos:', videosError);
      return NextResponse.json(
        { error: 'Failed to fetch video count' },
        { status: 500 }
      );
    }

    // 3. Count active projects (draft, processing, rendering)
    const { count: activeProjectsCount, error: activeError } = await adminSupabase
      .from('video_projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['draft', 'processing', 'rendering']);

    if (activeError) {
      console.error('Error counting active projects:', activeError);
      return NextResponse.json(
        { error: 'Failed to fetch active projects count' },
        { status: 500 }
      );
    }

    // 4. Calculate total credits used from credit_transactions
    const { data: transactions, error: transactionsError } = await adminSupabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user.id);

    if (transactionsError) {
      console.error('Error fetching credit transactions:', transactionsError);
      return NextResponse.json(
        { error: 'Failed to fetch credit transactions' },
        { status: 500 }
      );
    }

    let creditsUsed = 0;
    if (transactions) {
      for (const tx of transactions) {
        if (tx.amount < 0) {
          creditsUsed += Math.abs(tx.amount);
        }
      }
    }

    // 5. Get recent 5 projects with avatar details
    const { data: recentProjects, error: recentError } = await adminSupabase
      .from('video_projects')
      .select(`
        id,
        title,
        status,
        type,
        duration,
        created_at,
        avatar:ai_avatars(name, thumbnail_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error fetching recent projects:', recentError);
      return NextResponse.json(
        { error: 'Failed to fetch recent projects' },
        { status: 500 }
      );
    }

    // 6. Get usage chart data for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoIso = sevenDaysAgo.toISOString();

    const { data: chartTransactions, error: chartError } = await adminSupabase
      .from('credit_transactions')
      .select('amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgoIso)
      .order('created_at', { ascending: true });

    if (chartError) {
      console.error('Error fetching chart data:', chartError);
      return NextResponse.json(
        { error: 'Failed to fetch usage chart data' },
        { status: 500 }
      );
    }

    // Build usage chart by aggregating transactions by day
    const usageByDay: Record<string, number> = {};

    if (chartTransactions) {
      for (const tx of chartTransactions) {
        if (tx.amount < 0) {
          const date = new Date(tx.created_at).toISOString().split('T')[0];
          usageByDay[date] = (usageByDay[date] || 0) + Math.abs(tx.amount);
        }
      }
    }

    // Convert to array format with all last 7 days
    const usageChart: UsageChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      usageChart.push({
        date: dateStr,
        amount: usageByDay[dateStr] || 0,
      });
    }

    // Prepare response
    const response: DashboardResponse = {
      stats: {
        videosCreated: videosCreatedCount || 0,
        creditsUsed,
        creditsRemaining: userProfile?.credits_remaining || 0,
        activeProjects: activeProjectsCount || 0,
      },
      recentProjects: (recentProjects || []) as RecentProject[],
      usageChart,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
