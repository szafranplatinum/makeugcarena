import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { apiKeyService, API_KEY_IDS } from '@/lib/services/api-keys';

export const runtime = 'nodejs';

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
  const { product, tone, language, duration, customPrompt } = body;

  // Check credits first
  const { data: profile } = await adminDb
    .from('user_profiles')
    .select('credits_remaining')
    .eq('id', user.id)
    .single();

  const { data: creditCost } = await adminDb
    .from('credit_costs')
    .select('cost')
    .eq('action', 'script_gen')
    .single();

  const cost = creditCost?.cost || 0.1;

  if (!profile || profile.credits_remaining < cost) {
    return NextResponse.json(
      { error: 'Insufficient credits for script generation' },
      { status: 402 }
    );
  }

  try {
    // Determine which AI provider to use
    const provider = await apiKeyService.get(API_KEY_IDS.OPENAI_PROVIDER) || 'openai';
    let script: string;

    const systemPrompt = buildSystemPrompt(tone, language, duration);
    const userPrompt = customPrompt || buildUserPrompt(product, tone, duration);

    if (provider === 'anthropic') {
      script = await generateWithAnthropic(systemPrompt, userPrompt);
    } else {
      script = await generateWithOpenAI(systemPrompt, userPrompt);
    }

    // Deduct credits after successful generation
    await adminDb
      .from('user_profiles')
      .update({ credits_remaining: profile.credits_remaining - cost })
      .eq('id', user.id);

    await adminDb.from('credit_transactions').insert({
      user_id: user.id,
      amount: -cost,
      action: 'script_gen',
      description: `AI script generation (${provider}) for: ${product || 'product'}`,
    });

    return NextResponse.json({
      data: {
        script,
        language: language || 'en',
        tone: tone || 'professional',
        word_count: script.split(/\s+/).filter(Boolean).length,
        provider,
      },
    });
  } catch (error) {
    console.error('Script generation failed:', error);

    // Fall back to mock if API fails
    const fallbackScript = generateMockScript(product, tone, duration);
    return NextResponse.json({
      data: {
        script: fallbackScript,
        language: language || 'en',
        tone: tone || 'professional',
        word_count: fallbackScript.split(/\s+/).filter(Boolean).length,
        provider: 'mock',
        warning: error instanceof Error ? error.message : 'AI API unavailable, using template script',
      },
    });
  }
}

/**
 * Build system prompt for UGC script generation
 */
function buildSystemPrompt(tone?: string, language?: string, duration?: number): string {
  const dur = duration || 30;
  const toneDesc = tone || 'professional';
  const lang = language || 'en';

  return `You are an expert UGC (User-Generated Content) video script writer.
You create compelling, natural-sounding scripts for short-form video ads.

Guidelines:
- Write in a ${toneDesc} tone
- Target duration: approximately ${dur} seconds (about ${Math.round(dur * 2.5)} words)
- Language: ${lang === 'en' ? 'English' : lang === 'zh' ? 'Chinese (Mandarin)' : lang === 'es' ? 'Spanish' : lang === 'ja' ? 'Japanese' : lang === 'ko' ? 'Korean' : lang}
- Write as if a real person is talking naturally to camera
- Include a hook in the first line to grab attention
- Focus on benefits, not just features
- End with a clear call-to-action
- Do NOT include stage directions, emojis, or formatting markers
- Output ONLY the script text that will be spoken aloud`;
}

/**
 * Build user prompt for script generation
 */
function buildUserPrompt(product?: string, tone?: string, duration?: number): string {
  const productName = product || 'the product';
  const dur = duration || 30;

  return `Write a ${dur}-second UGC video script for "${productName}".
The script should feel authentic and relatable, like a real customer sharing their experience.
Make it persuasive but not salesy.`;
}

/**
 * Generate script using OpenAI API
 */
async function generateWithOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = await apiKeyService.get(API_KEY_IDS.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please set it in Admin → Settings.');
  }

  const model = await apiKeyService.get(API_KEY_IDS.OPENAI_MODEL) || 'gpt-4o';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error (${response.status}): ${err.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  const script = data.choices?.[0]?.message?.content?.trim();

  if (!script) {
    throw new Error('OpenAI returned empty response');
  }

  return script;
}

/**
 * Generate script using Anthropic Claude API
 */
async function generateWithAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = await apiKeyService.get(API_KEY_IDS.ANTHROPIC_API_KEY);
  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Please set it in Admin → Settings.');
  }

  const model = await apiKeyService.get(API_KEY_IDS.ANTHROPIC_MODEL) || 'claude-sonnet-4-20250514';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error (${response.status}): ${err.error?.message || 'Unknown error'}`
    );
  }

  const data = await response.json();
  const script = data.content?.[0]?.text?.trim();

  if (!script) {
    throw new Error('Anthropic returned empty response');
  }

  return script;
}

/**
 * Fallback mock script when AI API is unavailable
 */
function generateMockScript(product?: string, tone?: string, duration?: number): string {
  const productName = product || 'this amazing product';
  const dur = duration || 30;

  if (tone === 'casual') {
    return `Hey! So I've been using ${productName} for about a week now, and honestly? I'm obsessed.

Let me tell you why. First off, the quality is insane. Like, I was not expecting this level of quality at this price point.

Second, it's so easy to use. I literally figured it out in 5 minutes. No complicated setup, no confusing instructions.

And the best part? The results speak for themselves. My friends keep asking me what changed, and I just smile and tell them about ${productName}.

If you're on the fence, just try it. Trust me, you won't regret it. Link in bio!`;
  }

  return `Are you tired of [common problem]? Let me introduce you to ${productName}.

In just ${dur} seconds, I'll show you why thousands of people are switching to ${productName}.

Here's what makes it different: premium quality materials, intuitive design, and results you can actually see.

Don't just take my word for it — ${productName} has over 10,000 5-star reviews from real customers.

Ready to transform your [area]? Click the link below and get started with ${productName} today. Use code SAVE20 for 20% off your first order.`;
}
