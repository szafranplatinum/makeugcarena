import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { videoQueue } from '@/lib/queue/video-queue';

/**
 * GET /api/videos/[id]/status
 *
 * Gets the current generation status of a video project
 * Used for polling from frontend during video generation
 *
 * Query parameters:
 * - jobId (optional): specific job ID to check. If not provided, returns latest job
 *
 * Response:
 * {
 *   success: boolean
 *   status: 'draft' | 'processing' | 'rendering' | 'completed' | 'failed'
 *   progress: number (0-100)
 *   estimatedTimeRemaining?: number (in seconds)
 *   jobId?: string
 *   error?: string
 *   output?: {
 *     outputUrl: string
 *     thumbnailUrl: string
 *     subtitleUrl?: string
 *     duration?: number
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const jobId = request.nextUrl.searchParams.get('jobId') || undefined;

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

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      projectId,
      status: project.status,
      progress: calculateProgress(project),
    };

    // If job ID is provided, check that specific job
    if (jobId) {
      const job = videoQueue.getJobStatus(jobId);
      if (job) {
        response.jobId = job.id;
        response.progress = job.progress || 0;
        response.status = mapJobStatusToProjectStatus(job.status);

        if (job.error) {
          response.error = job.error;
        }

        if (job.completedAt && job.startedAt) {
          const duration =
            (job.completedAt.getTime() - job.startedAt.getTime()) / 1000;
          response.processingTime = `${duration.toFixed(1)}s`;
        }
      }
    }

    // If completed, include output URLs
    if (project.status === 'completed') {
      response.output = {
        outputUrl: project.output_url,
        thumbnailUrl: project.thumbnail_url,
        subtitleUrl: project.subtitle_url,
        duration: project.duration,
      };
    }

    // Include error message if failed
    if (project.status === 'failed' && project.error_message) {
      response.error = project.error_message;
    }

    // Calculate estimated time remaining (rough estimate)
    if (project.status === 'processing') {
      const progress = (response.progress as number) || 0;
      // Estimate based on typical processing time (~15-20 seconds total)
      // This is very rough - in production, track actual stage times
      const estimatedTotal = 20;
      const estimatedRemaining = Math.max(
        0,
        estimatedTotal - (estimatedTotal * progress) / 100
      );
      response.estimatedTimeRemaining = Math.round(estimatedRemaining);
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API] Video status error:', error);
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

/**
 * Maps job status to project status
 */
function mapJobStatusToProjectStatus(
  jobStatus: 'pending' | 'processing' | 'completed' | 'failed'
): string {
  switch (jobStatus) {
    case 'pending':
      return 'draft';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'draft';
  }
}

/**
 * Calculates progress percentage based on project status and metadata
 */
function calculateProgress(project: Record<string, unknown>): number {
  const status = project.status as string;

  switch (status) {
    case 'draft':
      return 0;
    case 'processing':
      // Check metadata for stage info
      const metadata = project.metadata as Record<string, unknown> | null;
      const stage = metadata?.stage as string | null;

      switch (stage) {
        case 'speech_generation':
          return 20;
        case 'lip_sync_generation':
          return 40;
        case 'subtitle_generation':
          return 60;
        case 'final_composition':
          return 80;
        default:
          return 10;
      }

    case 'rendering':
      return 90;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}
