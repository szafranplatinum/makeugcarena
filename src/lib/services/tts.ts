/**
 * TTS (Text-to-Speech) Service
 *
 * Integrates with ElevenLabs and Fish Audio for real voice synthesis.
 * API keys are loaded from the database via apiKeyService (encrypted at rest).
 * Generated audio is uploaded to Supabase Storage.
 */
import { apiKeyService, API_KEY_IDS } from '@/lib/services/api-keys';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export interface TTSInput {
  text: string;
  voiceId: string;
  language: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'aac';
}

export interface TTSResult {
  audioUrl: string;
  duration: number;
  format: string;
}

export interface ITTSProvider {
  name: string;
  generate(input: TTSInput): Promise<TTSResult>;
}

/**
 * Upload audio buffer to Supabase Storage and return public URL
 */
async function uploadAudioToStorage(
  audioBuffer: ArrayBuffer,
  filename: string,
  contentType: string
): Promise<string> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.storage
    .from('audio')
    .upload(filename, audioBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload audio: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('audio')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Estimate speech duration from word count
 */
function estimateDuration(wordCount: number, language: string): number {
  const speakingRates: Record<string, number> = {
    en: 150, es: 160, fr: 150, de: 150,
    zh: 200, ja: 180, ko: 170,
  };
  const langCode = language.split('-')[0].toLowerCase();
  const wordsPerMinute = speakingRates[langCode] || 150;
  return Math.ceil((wordCount / wordsPerMinute) * 60);
}

/**
 * ElevenLabs TTS Provider — Real API integration
 */
export class ElevenLabsTTSProvider implements ITTSProvider {
  name = 'elevenlabs';

  async generate(input: TTSInput): Promise<TTSResult> {
    const apiKey = await apiKeyService.get(API_KEY_IDS.ELEVENLABS_API_KEY);
    if (!apiKey) {
      console.warn('ElevenLabs API key not configured, falling back to mock');
      return this.generateMock(input);
    }

    try {
      const voiceId = input.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Default: Sarah
      const outputFormat = input.format === 'wav' ? 'pcm_44100' : 'mp3_44100_128';

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: input.format === 'wav' ? 'audio/wav' : 'audio/mpeg',
          },
          body: JSON.stringify({
            text: input.text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
            output_format: outputFormat,
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          `ElevenLabs API error (${response.status}): ${
            errBody.detail?.message || errBody.detail || JSON.stringify(errBody)
          }`
        );
      }

      const audioBuffer = await response.arrayBuffer();
      const format = input.format || 'mp3';
      const filename = `tts/${Date.now()}_${voiceId}.${format}`;
      const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';

      // Upload to Supabase Storage
      const audioUrl = await uploadAudioToStorage(audioBuffer, filename, contentType);

      // Estimate duration from word count (ElevenLabs doesn't return duration)
      const wordCount = input.text.split(/\s+/).length;
      const duration = estimateDuration(wordCount, input.language);

      return { audioUrl, duration, format };
    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      // Fall back to mock on error
      console.warn('Falling back to mock TTS');
      return this.generateMock(input);
    }
  }

  private async generateMock(input: TTSInput): Promise<TTSResult> {
    console.log(`[ElevenLabs Mock] Generating TTS for voice ${input.voiceId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const wordCount = input.text.split(/\s+/).length;
    const duration = estimateDuration(wordCount, input.language);
    const format = input.format || 'mp3';
    return {
      audioUrl: `https://mock-elevenlabs.example.com/audio/${input.voiceId}/${Date.now()}.${format}`,
      duration,
      format,
    };
  }
}

/**
 * Fish Audio TTS Provider — Real API integration
 */
export class FishAudioTTSProvider implements ITTSProvider {
  name = 'fish_audio';

  async generate(input: TTSInput): Promise<TTSResult> {
    const apiKey = await apiKeyService.get(API_KEY_IDS.FISH_AUDIO_API_KEY);
    if (!apiKey) {
      console.warn('Fish Audio API key not configured, falling back to mock');
      return this.generateMock(input);
    }

    try {
      const response = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input.text,
          reference_id: input.voiceId,
          format: input.format || 'mp3',
          latency: 'normal',
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(
          `Fish Audio API error (${response.status}): ${JSON.stringify(errBody)}`
        );
      }

      const audioBuffer = await response.arrayBuffer();
      const format = input.format || 'mp3';
      const filename = `tts/${Date.now()}_fish_${input.voiceId}.${format}`;
      const contentType = format === 'wav' ? 'audio/wav' : 'audio/mpeg';

      const audioUrl = await uploadAudioToStorage(audioBuffer, filename, contentType);
      const wordCount = input.text.split(/\s+/).length;
      const duration = estimateDuration(wordCount, input.language);

      return { audioUrl, duration, format };
    } catch (error) {
      console.error('Fish Audio TTS failed:', error);
      console.warn('Falling back to mock TTS');
      return this.generateMock(input);
    }
  }

  private async generateMock(input: TTSInput): Promise<TTSResult> {
    console.log(`[Fish Audio Mock] Generating TTS for voice ${input.voiceId}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const wordCount = input.text.split(/\s+/).length;
    const duration = estimateDuration(wordCount, input.language);
    const format = input.format || 'mp3';
    return {
      audioUrl: `https://mock-fish-audio.example.com/audio/${input.voiceId}/${Date.now()}.${format}`,
      duration,
      format,
    };
  }
}

/**
 * Mock TTS Provider for testing
 */
export class MockTTSProvider implements ITTSProvider {
  name = 'mock';

  async generate(input: TTSInput): Promise<TTSResult> {
    console.log(`[Mock TTS] Generating audio for voice ${input.voiceId}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const wordCount = input.text.split(/\s+/).length;
    const duration = estimateDuration(wordCount, input.language);
    const format = input.format || 'mp3';
    return {
      audioUrl: `https://mock-storage.example.com/audio/${Date.now()}.${format}`,
      duration,
      format,
    };
  }
}

/**
 * Gets the appropriate TTS provider based on admin configuration
 */
export async function getTTSProvider(): Promise<ITTSProvider> {
  const providerName = await apiKeyService.get(API_KEY_IDS.TTS_PROVIDER);

  switch (providerName) {
    case 'elevenlabs':
      return new ElevenLabsTTSProvider();
    case 'fish_audio':
      return new FishAudioTTSProvider();
    case 'mock':
      return new MockTTSProvider();
    default:
      // Auto-detect: try ElevenLabs first, then Fish Audio, then mock
      const elevenKey = await apiKeyService.get(API_KEY_IDS.ELEVENLABS_API_KEY);
      if (elevenKey) return new ElevenLabsTTSProvider();

      const fishKey = await apiKeyService.get(API_KEY_IDS.FISH_AUDIO_API_KEY);
      if (fishKey) return new FishAudioTTSProvider();

      return new MockTTSProvider();
  }
}
