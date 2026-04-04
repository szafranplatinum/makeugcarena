import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { CreditCost } from '@/types';

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

// GET: List all credit cost configs (admin only)
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: costs, error } = await supabase
      .from('credit_costs')
      .select('*')
      .order('action', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch credit costs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: costs || [],
    });
  } catch (error) {
    console.error('Admin credits fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch credit costs' },
      { status: 500 }
    );
  }
}

interface UpdateCreditCostBody {
  action: string;
  cost: number;
}

// PATCH: Update credit cost for an action (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const body: UpdateCreditCostBody = await request.json();

    if (!body.action || body.cost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: action, cost' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: cost, error } = await supabase
      .from('credit_costs')
      .update({
        cost: body.cost,
        updated_at: new Date().toISOString(),
      })
      .eq('action', body.action)
      .select()
      .single();

    if (error || !cost) {
      return NextResponse.json(
        { error: 'Failed to update credit cost' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cost,
    });
  } catch (error) {
    console.error('Admin credit cost update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update credit cost' },
      { status: 500 }
    );
  }
}

interface ManualAdjustmentBody {
  userId: string;
  amount: number;
  reason: string;
}

// POST: Manual credit adjustment for a user
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const body: ManualAdjustmentBody = await request.json();

    if (!body.userId || body.amount === undefined || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, amount, reason' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get user's current credits
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('credits_remaining')
      .eq('id', body.userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const newCredits = Math.max(0, (userProfile.credits_remaining || 0) + body.amount);

    // Update user's credits
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        credits_remaining: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.userId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: body.userId,
        amount: body.amount,
        action: 'admin_adjustment',
        description: body.reason,
        video_project_id: null,
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      // Still return success since credits were updated
      return NextResponse.json({
        success: true,
        data: {
          userId: body.userId,
          newCredits,
          message: 'Credits updated (transaction logging failed)',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        newCredits,
      },
    });
  } catch (error) {
    console.error('Admin credit adjustment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to adjust credits' },
      { status: 500 }
    );
  }
}
