import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PlanConfig } from '@/types';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: plans, error } = await supabase
      .from('plan_configs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: plans as PlanConfig[],
    });
  } catch (error) {
    console.error('Plans error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
