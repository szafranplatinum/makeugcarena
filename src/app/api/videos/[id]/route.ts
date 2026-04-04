import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/videos/[id]
 *
 * Gets video project details
 * Accessible by project owner or admins
 *
 * Response includes full project data with avatar and metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const supabase = createServerSupabaseClient();

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

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('video_projects')
      .select(
        `
        *,
        avatar:avatar_id (*)
      `
      )
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    // Check access: owner or admin
    const isOwner = project.user_id === user.id;
    const { data: userData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this project' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: project }, { status: 200 });
  } catch (error) {
    console.error('[API] Video GET error:', error);
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
 * PATCH /api/videos/[id]
 *
 * Updates video project (title, etc.)
 * Only accessible by project owner
 *
 * Request body:
 * {
 *   title?: string
 *   metadata?: Record<string, unknown>
 * }
 *
 * Cannot update: status, script, avatar, voice, output files
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const supabase = createServerSupabaseClient();

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

    // Get project and verify ownership
    const { data: project, error: projectError } = await supabase
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

    // Validate update payload - only allow certain fields
    const allowedFields = ['title', 'metadata'];
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Validate title if provided
    if (updateData.title && typeof updateData.title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title must be a string' },
        { status: 400 }
      );
    }

    // Update project
    const { data: updated, error: updateError } = await supabase
      .from('video_projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (error) {
    console.error('[API] Video PATCH error:', error);
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
 * DELETE /api/videos/[id]
 *
 * Deletes a video project
 * Only accessible by project owner
 *
 * If project is in 'draft' status, refunds credits to user
 * Removes all associated files from storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const supabase = createServerSupabaseClient();

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

    // Get project and verify ownership
    const { data: project, error: projectError } = await supabase
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

    // Handle credit refund if in draft status
    if (project.status === 'draft' && project.credits_used > 0) {
      // Add credits back to user
      const { error: creditError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: project.credits_used,
          action: 'admin_adjustment',
          description: `Refund for deleted project: ${projectId}`,
          video_project_id: projectId,
        });

      if (creditError) {
        console.error('Failed to create refund transaction:', creditError);
        // Don't fail deletion due to credit refund issue
      }

      // Update user's credits
      await supabase.rpc('increment_credits', {
        user_id: user.id,
        amount: project.credits_used,
      });
    }

    // Delete project
    const { error: deleteError } = await supabase
      .from('video_projects')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    // TODO: Delete associated files from storage (output_url, thumbnail_url, subtitle_url)
    // This would require using Supabase Storage API to remove objects

    return NextResponse.json(
      { success: true, message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Video DELETE error:', error);
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
