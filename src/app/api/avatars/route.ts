import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { AIAvatar, PaginatedResponse } from '@/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass RLS (avatars are public data)
    const supabase = createAdminSupabaseClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const gender = searchParams.get('gender');
    const ethnicity = searchParams.get('ethnicity');
    const style = searchParams.get('style');
    const search = searchParams.get('search');
    const premium = searchParams.get('premium');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '12')));

    // Build query for active avatars only
    let query = supabase
      .from('ai_avatars')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (gender) {
      query = query.eq('gender', gender);
    }
    if (ethnicity) {
      query = query.eq('ethnicity', ethnicity);
    }
    if (style) {
      query = query.eq('style', style);
    }
    if (premium !== null && premium !== undefined) {
      query = query.eq('is_premium', premium === 'true');
    }

    // Apply search (text search on name)
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Order by sort_order and apply pagination
    const { data: avatars, count, error } = await query
      .order('sort_order', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch avatars' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const response: PaginatedResponse<AIAvatar> = {
      data: avatars || [],
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Avatars error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}
