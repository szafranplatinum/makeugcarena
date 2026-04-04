import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export interface AvatarVoice {
  id: string;
  avatar_id: string;
  name: string;
  language: string;
  accent: string | null;
  provider: 'elevenlabs' | 'fish_audio' | 'google' | 'azure';
  provider_voice_id: string;
  sample_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

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

// GET: List all voices (including inactive)
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

    const { data: voices, count, error } = await supabase
      .from('avatar_voices')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch voices' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        voices: voices || [],
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Admin voices fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}

interface CreateVoiceBody {
  avatar_id: string;
  name: string;
  language: string;
  accent?: string | null;
  provider: 'elevenlabs' | 'fish_audio' | 'google' | 'azure';
  provider_voice_id: string;
  sample_url?: string | null;
}

// POST: Create voice
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdmin();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: admin access required' },
        { status: 403 }
      );
    }

    const body: CreateVoiceBody = await request.json();

    // Validate required fields
    if (!body.avatar_id || !body.name || !body.language || !body.provider || !body.provider_voice_id) {
      return NextResponse.json(
        { error: 'Missing required fields: avatar_id, name, language, provider, provider_voice_id' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Verify avatar exists
    const { data: avatar, error: avatarError } = await supabase
      .from('ai_avatars')
      .select('id')
      .eq('id', body.avatar_id)
      .single();

    if (avatarError || !avatar) {
      return NextResponse.json(
        { error: 'Avatar not found' },
        { status: 404 }
      );
    }

    // Get max sort_order for this avatar
    const { data: lastVoice } = await supabase
      .from('avatar_voices')
      .select('sort_order')
      .eq('avatar_id', body.avatar_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (lastVoice?.sort_order || 0) + 1;

    const { data: voice, error } = await supabase
      .from('avatar_voices')
      .insert({
        avatar_id: body.avatar_id,
        name: body.name,
        language: body.language,
        accent: body.accent || null,
        provider: body.provider,
        provider_voice_id: body.provider_voice_id,
        sample_url: body.sample_url || null,
        is_active: true,
        sort_order: sortOrder,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create voice error:', error);
      return NextResponse.json(
        { error: 'Failed to create voice' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: voice as AvatarVoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin voice create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create voice' },
      { status: 500 }
    );
  }
}

interface UpdateVoiceBody {
  name?: string;
  language?: string;
  accent?: string | null;
  provider?: 'elevenlabs' | 'fish_audio' | 'google' | 'azure';
  provider_voice_id?: string;
  sample_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// PUT: Update voice
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
    const voiceId = url.searchParams.get('id');

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID required' },
        { status: 400 }
      );
    }

    const body: UpdateVoiceBody = await request.json();

    const supabase = createAdminSupabaseClient();

    // Build update object - only include provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.accent !== undefined) updateData.accent = body.accent;
    if (body.provider !== undefined) updateData.provider = body.provider;
    if (body.provider_voice_id !== undefined) updateData.provider_voice_id = body.provider_voice_id;
    if (body.sample_url !== undefined) updateData.sample_url = body.sample_url;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: voice, error } = await supabase
      .from('avatar_voices')
      .update(updateData)
      .eq('id', voiceId)
      .select()
      .single();

    if (error) {
      console.error('Update voice error:', error);
      return NextResponse.json(
        { error: 'Failed to update voice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: voice as AvatarVoice,
    });
  } catch (error) {
    console.error('Admin voice update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update voice' },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete voice
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
    const voiceId = url.searchParams.get('id');

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Voice ID required' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: voice, error } = await supabase
      .from('avatar_voices')
      .update({ is_active: false })
      .eq('id', voiceId)
      .select()
      .single();

    if (error) {
      console.error('Delete voice error:', error);
      return NextResponse.json(
        { error: 'Failed to delete voice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: voice as AvatarVoice,
    });
  } catch (error) {
    console.error('Admin voice delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete voice' },
      { status: 500 }
    );
  }
}
