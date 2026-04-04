import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { AIAvatar } from '@/types';

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

// GET: List all avatars including inactive (admin only)
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
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));

    const { data: avatars, count, error } = await supabase
      .from('ai_avatars')
      .select('*', { count: 'exact' })
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

    return NextResponse.json({
      success: true,
      data: {
        avatars: avatars || [],
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Admin avatars fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}

interface CreateAvatarBody {
  name: string;
  thumbnail_url: string;
  preview_video_url?: string;
  gender: 'male' | 'female' | 'non_binary';
  ethnicity: 'asian' | 'black' | 'caucasian' | 'hispanic' | 'middle_eastern' | 'mixed';
  style: 'professional' | 'casual' | 'creative' | 'lifestyle';
  age_range: string;
  languages: string[];
  is_premium?: boolean;
}

interface UpdateAvatarBody {
  name?: string;
  thumbnail_url?: string;
  preview_video_url?: string | null;
  gender?: 'male' | 'female' | 'non_binary';
  ethnicity?: 'asian' | 'black' | 'caucasian' | 'hispanic' | 'middle_eastern' | 'mixed';
  style?: 'professional' | 'casual' | 'creative' | 'lifestyle';
  age_range?: string;
  languages?: string[];
  is_premium?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

// POST: Create new avatar (admin only)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const body: CreateAvatarBody = await request.json();

    // Validate required fields
    if (!body.name || !body.thumbnail_url || !body.gender || !body.ethnicity || !body.style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get max sort_order
    const { data: lastAvatar } = await supabase
      .from('ai_avatars')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastAvatar?.sort_order || 0) + 1;

    const { data: avatar, error } = await supabase
      .from('ai_avatars')
      .insert({
        name: body.name,
        thumbnail_url: body.thumbnail_url,
        preview_video_url: body.preview_video_url || null,
        gender: body.gender,
        ethnicity: body.ethnicity,
        style: body.style,
        age_range: body.age_range,
        languages: body.languages,
        is_premium: body.is_premium || false,
        is_active: true,
        sort_order: sortOrder,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create avatar error:', error);
      return NextResponse.json(
        { error: 'Failed to create avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: avatar as AIAvatar,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin avatar create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create avatar' },
      { status: 500 }
    );
  }
}

// PUT: Update avatar by id (admin only)
export async function PUT(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const avatarId = url.searchParams.get('id');

    if (!avatarId) {
      return NextResponse.json(
        { error: 'Avatar ID required' },
        { status: 400 }
      );
    }

    const body: UpdateAvatarBody = await request.json();

    const supabase = createAdminSupabaseClient();

    // Build update object - only include provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.thumbnail_url !== undefined) updateData.thumbnail_url = body.thumbnail_url;
    if (body.preview_video_url !== undefined) updateData.preview_video_url = body.preview_video_url;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.ethnicity !== undefined) updateData.ethnicity = body.ethnicity;
    if (body.style !== undefined) updateData.style = body.style;
    if (body.age_range !== undefined) updateData.age_range = body.age_range;
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.is_premium !== undefined) updateData.is_premium = body.is_premium;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: avatar, error } = await supabase
      .from('ai_avatars')
      .update(updateData)
      .eq('id', avatarId)
      .select()
      .single();

    if (error) {
      console.error('Update avatar error:', error);
      return NextResponse.json(
        { error: 'Failed to update avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: avatar as AIAvatar,
    });
  } catch (error) {
    console.error('Admin avatar update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update avatar' },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete avatar by id (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const avatarId = url.searchParams.get('id');

    if (!avatarId) {
      return NextResponse.json(
        { error: 'Avatar ID required' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: avatar, error } = await supabase
      .from('ai_avatars')
      .update({ is_active: false })
      .eq('id', avatarId)
      .select()
      .single();

    if (error) {
      console.error('Delete avatar error:', error);
      return NextResponse.json(
        { error: 'Failed to delete avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: avatar as AIAvatar,
    });
  } catch (error) {
    console.error('Admin avatar delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
