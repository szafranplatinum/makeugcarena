import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/seed
 *
 * Seeds test data: avatars + gives credits to test user.
 * Should only be used in development.
 */
export async function POST() {
  try {
    const supabase = createAdminSupabaseClient();

    // ---- Insert test avatars ----
    const avatars = [
      {
        name: 'Sophia Chen',
        thumbnail_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
        gender: 'female',
        ethnicity: 'asian',
        style: 'professional',
        age_range: '25-35',
        languages: ['en', 'zh'],
        is_premium: false,
        sort_order: 1,
      },
      {
        name: 'James Wilson',
        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
        gender: 'male',
        ethnicity: 'caucasian',
        style: 'professional',
        age_range: '30-40',
        languages: ['en'],
        is_premium: false,
        sort_order: 2,
      },
      {
        name: 'Amara Johnson',
        thumbnail_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop',
        gender: 'female',
        ethnicity: 'black',
        style: 'casual',
        age_range: '20-30',
        languages: ['en', 'fr'],
        is_premium: false,
        sort_order: 3,
      },
      {
        name: 'Carlos Rivera',
        thumbnail_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop',
        gender: 'male',
        ethnicity: 'hispanic',
        style: 'casual',
        age_range: '25-35',
        languages: ['en', 'es'],
        is_premium: false,
        sort_order: 4,
      },
      {
        name: 'Emma Thompson',
        thumbnail_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
        gender: 'female',
        ethnicity: 'caucasian',
        style: 'lifestyle',
        age_range: '25-35',
        languages: ['en', 'de'],
        is_premium: false,
        sort_order: 5,
      },
      {
        name: 'Kenji Tanaka',
        thumbnail_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop',
        gender: 'male',
        ethnicity: 'asian',
        style: 'creative',
        age_range: '20-30',
        languages: ['en', 'ja'],
        is_premium: true,
        sort_order: 6,
      },
      {
        name: 'Fatima Al-Hassan',
        thumbnail_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop',
        gender: 'female',
        ethnicity: 'middle_eastern',
        style: 'professional',
        age_range: '25-35',
        languages: ['en', 'ar'],
        is_premium: true,
        sort_order: 7,
      },
      {
        name: 'Marcus Brown',
        thumbnail_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop',
        gender: 'male',
        ethnicity: 'black',
        style: 'casual',
        age_range: '30-40',
        languages: ['en'],
        is_premium: false,
        sort_order: 8,
      },
      {
        name: 'Luna Martinez',
        thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
        gender: 'female',
        ethnicity: 'hispanic',
        style: 'creative',
        age_range: '20-30',
        languages: ['en', 'es'],
        is_premium: false,
        sort_order: 9,
      },
      {
        name: 'Alex Kim',
        thumbnail_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop',
        gender: 'non_binary',
        ethnicity: 'mixed',
        style: 'creative',
        age_range: '20-30',
        languages: ['en', 'ko'],
        is_premium: true,
        sort_order: 10,
      },
      {
        name: 'Sarah Williams',
        thumbnail_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop',
        gender: 'female',
        ethnicity: 'caucasian',
        style: 'professional',
        age_range: '30-40',
        languages: ['en', 'fr'],
        is_premium: false,
        sort_order: 11,
      },
      {
        name: 'David Chen',
        thumbnail_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop',
        gender: 'male',
        ethnicity: 'asian',
        style: 'lifestyle',
        age_range: '25-35',
        languages: ['en', 'zh'],
        is_premium: false,
        sort_order: 12,
      },
    ];

    // Delete existing avatars first to avoid duplicates
    await supabase.from('ai_avatars').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: insertedAvatars, error: avatarError } = await supabase
      .from('ai_avatars')
      .insert(avatars)
      .select();

    if (avatarError) {
      return NextResponse.json(
        { error: `Failed to insert avatars: ${avatarError.message}` },
        { status: 500 }
      );
    }

    // ---- Give all users 100 credits for testing ----
    const { error: creditError } = await supabase
      .from('user_profiles')
      .update({ credits_remaining: 100, credits_monthly: 100, plan: 'pro' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (creditError) {
      return NextResponse.json(
        {
          error: `Avatars inserted but failed to update credits: ${creditError.message}`,
          avatarsInserted: insertedAvatars?.length || 0,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${insertedAvatars?.length || 0} avatars and updated user credits to 100`,
      avatars: insertedAvatars?.length || 0,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}
