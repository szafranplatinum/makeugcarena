import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

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

// GET: List all voices, optionally filtered by language, provider, avatar_id
export async function GET(request: NextRequest) {
  try {
    // Use admin client to bypass RLS (voices are public data for active voices)
    const supabase = createAdminSupabaseClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language');
    const provider = searchParams.get('provider');
    const avatarId = searchParams.get('avatar_id');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));

    // Build query for active voices only
    let query = supabase
      .from('avatar_voices')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Apply filters
    if (language) {
      query = query.eq('language', language);
    }
    if (provider) {
      query = query.eq('provider', provider);
    }
    if (avatarId) {
      query = query.eq('avatar_id', avatarId);
    }

    // Order by sort_order and apply pagination
    const { data: voices, count, error } = await query
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
    console.error('Voices fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
