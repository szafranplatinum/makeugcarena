import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CreditTransaction, PaginatedResponse } from '@/types';

export const runtime = 'nodejs';

function getDateRangeFilter(period: string): string | null {
  const now = new Date();
  let fromDate: Date | null = null;

  switch (period) {
    case '7d':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      return null;
    default:
      return null;
  }

  return fromDate ? fromDate.toISOString() : null;
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const period = searchParams.get('period') || 'all';

    // Build query
    let query = supabase
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply date filter if needed
    const dateFilter = getDateRangeFilter(period);
    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    // Apply pagination
    const { data: transactions, count, error } = await query
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch usage data' },
        { status: 500 }
      );
    }

    // Calculate summary stats
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    let totalEarned = 0;
    let totalSpent = 0;

    if (transactions) {
      for (const tx of transactions) {
        if (tx.amount > 0) {
          totalEarned += tx.amount;
        } else {
          totalSpent += Math.abs(tx.amount);
        }
      }
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const response: PaginatedResponse<CreditTransaction> & {
      summary: {
        total_earned: number;
        total_spent: number;
        current_balance: number;
      };
    } = {
      data: transactions || [],
      total,
      page,
      pageSize,
      totalPages,
      summary: {
        total_earned: totalEarned,
        total_spent: totalSpent,
        current_balance: userProfile?.credits_remaining || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Usage error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
