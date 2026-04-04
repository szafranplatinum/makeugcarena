import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import type { AIAvatar } from '@/types';

export const runtime = 'nodejs';

// Helper: Verify admin role
async function verifyAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) return null;
  return user;
}

// GET single avatar
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = params;

    const { data: avatar, error } = await supabase
      .from('ai_avatars')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !avatar) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: avatar as AIAvatar,
    });
  } catch (error) {
    console.error('Avatar fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch avatar' },
      { status: 500 }
    );
  }
}

// PATCH: Update avatar (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const supabase = createAdminSupabaseClient();

    const { data: avatar, error } = await supabase
      .from('ai_avatars')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !avatar) {
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
    console.error('Avatar update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update avatar' },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete avatar (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const supabase = createAdminSupabaseClient();

    const { data, error } = await supabase
      .from('ai_avatars')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to delete avatar' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar deleted',
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete avatar' },
      { status: 500 }
    );
  }
}
