import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { apiKeyService, API_KEY_IDS } from '@/lib/services/api-keys';

/**
 * Verify the request is from an admin user
 */
async function verifyAdmin() {
  const supabase = createServerSupabaseClient();
  const adminDb = createAdminSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use admin client to bypass RLS recursion
  const { data: profile } = await adminDb
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return null;
  }

  return user;
}

/**
 * GET /api/admin/api-keys
 *
 * Returns all API key configurations with sensitive values masked.
 * Config values (provider, model, etc.) are returned as-is.
 */
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const masked = await apiKeyService.getAllMasked();
    return NextResponse.json({ success: true, data: masked });
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get API keys' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/api-keys
 *
 * Updates API keys and configurations.
 * Only sends keys that have changed (non-empty values).
 * Sensitive keys are encrypted before storage.
 *
 * Request body: Record<string, string>
 */
export async function PATCH(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validKeys = new Set(Object.values(API_KEY_IDS));

    // Filter to only valid key IDs and non-empty values
    const updates: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if (validKeys.has(key as any) && typeof value === 'string' && value.trim() !== '') {
        // Skip masked values (user didn't change the key)
        if (value.includes('••••')) continue;
        updates[key] = value.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes to save' });
    }

    await apiKeyService.setMany(updates);

    return NextResponse.json({
      success: true,
      message: `Updated ${Object.keys(updates).length} setting(s)`,
      updated: Object.keys(updates),
    });
  } catch (error) {
    console.error('Failed to save API keys:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/api-keys/test
 *
 * Tests connectivity for a specific API provider.
 */
export async function POST(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { provider } = await request.json();

    switch (provider) {
      case 'openai': {
        const key = await apiKeyService.get(API_KEY_IDS.OPENAI_API_KEY);
        if (!key) return NextResponse.json({ success: false, error: 'OpenAI API key not configured' });

        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'OpenAI connection successful' });
        }
        const err = await res.json();
        return NextResponse.json({ success: false, error: err.error?.message || 'Connection failed' });
      }

      case 'anthropic': {
        const key = await apiKeyService.get(API_KEY_IDS.ANTHROPIC_API_KEY);
        if (!key) return NextResponse.json({ success: false, error: 'Anthropic API key not configured' });

        // Simple model list check
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
          }),
        });
        if (res.ok) {
          return NextResponse.json({ success: true, message: 'Anthropic connection successful' });
        }
        const err = await res.json();
        return NextResponse.json({ success: false, error: err.error?.message || 'Connection failed' });
      }

      case 'elevenlabs': {
        const key = await apiKeyService.get(API_KEY_IDS.ELEVENLABS_API_KEY);
        if (!key) return NextResponse.json({ success: false, error: 'ElevenLabs API key not configured' });

        try {
          const res = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: { 'xi-api-key': key },
          });
          if (res.ok) {
            return NextResponse.json({ success: true, message: 'ElevenLabs connection successful' });
          }
          const errBody = await res.text().catch(() => '');
          return NextResponse.json({
            success: false,
            error: `ElevenLabs API returned ${res.status}: ${errBody.substring(0, 200) || res.statusText}`,
          });
        } catch (fetchErr) {
          return NextResponse.json({
            success: false,
            error: `Network error connecting to ElevenLabs: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
          });
        }
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown provider: ${provider}` });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
    });
  }
}
