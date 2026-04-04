import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { videoGenerationService } from '@/lib/services/video-generator';
import { videoQueue } from '@/lib/queue/video-queue';

/**
 * POST /api/videos/generate
 *
 * Triggers video generation for a project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const adminDb = createAdminSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get project and verify ownership (use admin client to bypass RLS)
    const { data: project, error: projectError } = await adminDb
      .from('video_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or you do not have access to it',
        },
        { status: 404 }
      );
    }

    // Validate project status
    if (project.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot generate video for project with status: ${project.status}`,
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (
      !project.script ||
      !project.avatar_id ||
      !project.voice_id ||
      !project.language
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Project is missing required fields: script, avatar, voice, or language',
        },
        { status: 400 }
      );
    }

    // Register video generation processor if not already done
    videoQueue.registerProcessor('video_generation', async (job) => {
      const input = job.data as unknown as Parameters<
        typeof videoGenerationService.generate
      >[0];
      const result = await videoGenerationService.generate(input);
      return result as unknown as Record<string, unknown>;
    });

    // Add job to queue
    const jobId = await videoQueue.addJob('video_generation', {
      projectId,
      script: project.script,
      avatarId: project.avatar_id,
      voiceId: project.voice_id,
      language: project.language,
      ratio: project.ratio,
      resolution: project.resolution,
    });

    console.log(
      `[API] Created video generation job ${jobId} for project ${projectId}`
    );

    return NextResponse.json(
      { success: true, jobId },
      { status: 202 }
    );
  } catch (error) {
    console.error('[API] Video generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
