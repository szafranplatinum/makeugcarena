import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminDb = createAdminSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '12');
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';

  // Use admin client to bypass RLS recursion
  let query = adminDb
    .from('video_projects')
    .select('*, avatar:ai_avatars(id, name, thumbnail_url)', { count: 'exact' })
    .eq('user_id', user.id);

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const adminDb = createAdminSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Use admin client to bypass RLS recursion on user_profiles
  const { data: profile } = await adminDb
    .from('user_profiles')
    .select('credits_remaining')
    .eq('id', user.id)
    .single();

  if (!profile || profile.credits_remaining <= 0) {
    return NextResponse.json(
      { error: 'Insufficient credits. Please upgrade your plan.' },
      { status: 402 }
    );
  }

  const { data: creditCost } = await adminDb
    .from('credit_costs')
    .select('cost')
    .eq('action', body.type || 'talking_head')
    .single();

  const cost = creditCost?.cost || 1;

  if (profile.credits_remaining < cost) {
    return NextResponse.json(
      { error: `This action requires ${cost} credits. You have ${profile.credits_remaining}.` },
      { status: 402 }
    );
  }

  // Create video project
  const { data: project, error } = await adminDb
    .from('video_projects')
    .insert({
      user_id: user.id,
      title: body.title || 'Untitled Project',
      type: body.type || 'talking_head',
      script: body.script || '',
      avatar_id: body.avatarId || null,
      voice_id: body.voiceId || null,
      language: body.language || 'en',
      ratio: body.ratio || '9:16',
      resolution: body.resolution || '1080p',
      credits_used: cost,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduct credits
  await adminDb
    .from('user_profiles')
    .update({
      credits_remaining: profile.credits_remaining - cost,
    })
    .eq('id', user.id);

  // Record credit transaction
  await adminDb.from('credit_transactions').insert({
    user_id: user.id,
    amount: -cost,
    action: body.type || 'talking_head',
    description: `Video generation: ${project.title}`,
    video_project_id: project.id,
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
