import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/setup
 *
 * Sets up required Supabase Storage buckets for the application.
 * Should be called once during initial deployment.
 */
export async function POST() {
  const supabase = createServerSupabaseClient();
  const adminDb = createAdminSupabaseClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await adminDb
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: Record<string, string> = {};

  // Create audio bucket (for TTS output)
  try {
    const { data: existing } = await adminDb.storage.getBucket('audio');
    if (!existing) {
      const { error } = await adminDb.storage.createBucket('audio', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp4', 'text/vtt'],
      });
      results.audio = error ? `Error: ${error.message}` : 'Created';
    } else {
      results.audio = 'Already exists';
    }
  } catch (e) {
    results.audio = `Error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Create videos bucket (for output videos)
  try {
    const { data: existing } = await adminDb.storage.getBucket('videos');
    if (!existing) {
      const { error } = await adminDb.storage.createBucket('videos', {
        public: true,
        fileSizeLimit: 52428800, // 50MB (free tier limit)
        allowedMimeTypes: ['video/mp4', 'video/webm', 'image/jpeg', 'image/png'],
      });
      results.videos = error ? `Error: ${error.message}` : 'Created';
    } else {
      results.videos = 'Already exists';
    }
  } catch (e) {
    results.videos = `Error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Create avatars bucket (for avatar images)
  try {
    const { data: existing } = await adminDb.storage.getBucket('avatars');
    if (!existing) {
      const { error } = await adminDb.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      results.avatars = error ? `Error: ${error.message}` : 'Created';
    } else {
      results.avatars = 'Already exists';
    }
  } catch (e) {
    results.avatars = `Error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({
    success: true,
    message: 'Storage setup complete',
    buckets: results,
  });
}
