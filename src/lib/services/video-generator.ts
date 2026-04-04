import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { apiKeyService, API_KEY_IDS } from '@/lib/services/api-keys';
import { getTTSProvider } from '@/lib/services/tts';
import { VideoProject, VideoStatus } from '@/types';

/**
 * Input parameters for video generation
 */
export interface VideoGenerationInput {
  projectId: string;
  script: string;
  avatarId: string;
  voiceId: string;
  language: string;
  ratio: '16:9' | '9:16' | '1:1';
  resolution: '1080p' | '4k';
}

/**
 * Result of successful video generation
 */
export interface VideoGenerationResult {
  outputUrl: string;
  thumbnailUrl: string;
  subtitleUrl: string;
  duration: number;
}

interface TTSGenerationResult {
  audioUrl: string;
  duration: number;
}

interface LipSyncGenerationResult {
  videoUrl: string;
}

interface SubtitleGenerationResult {
  subtitleUrl: string;
}

interface CompositionResult {
  outputUrl: string;
  thumbnailUrl: string;
}

/**
 * VideoGenerationService orchestrates the entire video generation pipeline
 *
 * Pipeline steps:
 * 1. Script validation
 * 2. TTS (Text-to-Speech) generation — ElevenLabs / Fish Audio / Mock
 * 3. Avatar lip-sync video generation — HeyGen / Simli / Mock
 * 4. Subtitle generation — Whisper / Mock
 * 5. Final render composition — FFmpeg / Mock
 */
export class VideoGenerationService {
  private get supabase() {
    return createAdminSupabaseClient();
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    try {
      await this.validateInput(input);

      // Step 1: Generate speech
      await this.updateProjectStatus(input.projectId, 'processing', {
        stage: 'speech_generation',
      });

      const ttsResult = await this.generateSpeech(
        input.script,
        input.voiceId,
        input.language
      );

      // Step 2: Generate lip-sync video
      await this.updateProjectStatus(input.projectId, 'processing', {
        stage: 'lip_sync_generation',
        duration: ttsResult.duration,
      });

      const lipSyncResult = await this.generateLipSync(
        input.avatarId,
        ttsResult.audioUrl
      );

      // Step 3: Generate subtitles
      await this.updateProjectStatus(input.projectId, 'processing', {
        stage: 'subtitle_generation',
      });

      const subtitleResult = await this.generateSubtitles(
        input.script,
        ttsResult.audioUrl,
        input.language
      );

      // Step 4: Compose final video
      await this.updateProjectStatus(input.projectId, 'processing', {
        stage: 'final_composition',
      });

      const compositionResult = await this.composeFinalVideo(
        lipSyncResult.videoUrl,
        subtitleResult.subtitleUrl,
        input.ratio,
        input.resolution
      );

      // Completed
      await this.updateProjectStatus(input.projectId, 'completed', {
        output_url: compositionResult.outputUrl,
        thumbnail_url: compositionResult.thumbnailUrl,
        subtitle_url: subtitleResult.subtitleUrl,
        duration: ttsResult.duration,
      });

      return {
        outputUrl: compositionResult.outputUrl,
        thumbnailUrl: compositionResult.thumbnailUrl,
        subtitleUrl: subtitleResult.subtitleUrl,
        duration: ttsResult.duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      await this.updateProjectStatus(input.projectId, 'failed', {
        error_message: errorMessage,
      });
      throw error;
    }
  }

  private async validateInput(input: VideoGenerationInput): Promise<void> {
    if (!input.projectId) throw new Error('Project ID is required');
    if (!input.script || input.script.trim().length === 0) throw new Error('Script cannot be empty');
    if (!input.avatarId) throw new Error('Avatar ID is required');
    if (!input.voiceId) throw new Error('Voice ID is required');
    if (!input.language) throw new Error('Language is required');
  }

  /**
   * Generates speech using the configured TTS provider (ElevenLabs, Fish Audio, or Mock)
   */
  private async generateSpeech(
    script: string,
    voiceId: string,
    language: string
  ): Promise<TTSGenerationResult> {
    console.log(`[TTS] Generating speech for voice ${voiceId} in ${language}`);

    const ttsProvider = await getTTSProvider();
    console.log(`[TTS] Using provider: ${ttsProvider.name}`);

    const result = await ttsProvider.generate({
      text: script,
      voiceId,
      language,
    });

    return {
      audioUrl: result.audioUrl,
      duration: result.duration,
    };
  }

  /**
   * Generates lip-sync video using configured provider (HeyGen, Simli, or Mock)
   */
  private async generateLipSync(
    avatarId: string,
    audioUrl: string
  ): Promise<LipSyncGenerationResult> {
    const provider = await apiKeyService.get(API_KEY_IDS.LIPSYNC_PROVIDER) || 'mock';
    console.log(`[LipSync] Using provider: ${provider} for avatar ${avatarId}`);

    if (provider === 'heygen') {
      return this.generateLipSyncHeyGen(avatarId, audioUrl);
    } else if (provider === 'simli') {
      return this.generateLipSyncSimli(avatarId, audioUrl);
    }

    return this.generateLipSyncMock(avatarId, audioUrl);
  }

  /**
   * HeyGen Lip-Sync API integration
   */
  private async generateLipSyncHeyGen(
    avatarId: string,
    audioUrl: string
  ): Promise<LipSyncGenerationResult> {
    const apiKey = await apiKeyService.get(API_KEY_IDS.HEYGEN_API_KEY);
    if (!apiKey) {
      console.warn('HeyGen API key not configured, falling back to mock');
      return this.generateLipSyncMock(avatarId, audioUrl);
    }

    try {
      // Step 1: Create video generation task
      const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_inputs: [
            {
              character: {
                type: 'avatar',
                avatar_id: avatarId,
                avatar_style: 'normal',
              },
              voice: {
                type: 'audio',
                audio_url: audioUrl,
              },
            },
          ],
          dimension: { width: 1920, height: 1080 },
        }),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json().catch(() => ({}));
        throw new Error(`HeyGen create error: ${JSON.stringify(err)}`);
      }

      const createData = await createResponse.json();
      const videoId = createData.data?.video_id;
      if (!videoId) throw new Error('HeyGen did not return video_id');

      // Step 2: Poll for completion
      const videoUrl = await this.pollHeyGenVideo(apiKey, videoId);
      return { videoUrl };
    } catch (error) {
      console.error('HeyGen lip-sync failed:', error);
      return this.generateLipSyncMock(avatarId, audioUrl);
    }
  }

  /**
   * Poll HeyGen API for video completion
   */
  private async pollHeyGenVideo(apiKey: string, videoId: string): Promise<string> {
    const maxAttempts = 60; // 5 minutes max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://api.heygen.com/v1/video_status.get?video_id=${videoId}`,
        { headers: { 'X-Api-Key': apiKey } }
      );

      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();
      const status = statusData.data?.status;

      if (status === 'completed') {
        return statusData.data.video_url;
      } else if (status === 'failed') {
        throw new Error(`HeyGen video generation failed: ${statusData.data?.error || 'Unknown'}`);
      }
      // Still processing, continue polling
    }
    throw new Error('HeyGen video generation timed out');
  }

  /**
   * Simli Lip-Sync API integration
   */
  private async generateLipSyncSimli(
    avatarId: string,
    audioUrl: string
  ): Promise<LipSyncGenerationResult> {
    const apiKey = await apiKeyService.get(API_KEY_IDS.SIMLI_API_KEY);
    if (!apiKey) {
      console.warn('Simli API key not configured, falling back to mock');
      return this.generateLipSyncMock(avatarId, audioUrl);
    }

    try {
      const response = await fetch('https://api.simli.ai/textToVideoStream', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faceId: avatarId,
          audioUrl: audioUrl,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Simli API error: ${JSON.stringify(err)}`);
      }

      const data = await response.json();
      return { videoUrl: data.videoUrl || data.url };
    } catch (error) {
      console.error('Simli lip-sync failed:', error);
      return this.generateLipSyncMock(avatarId, audioUrl);
    }
  }

  /**
   * Mock lip-sync for development
   */
  private async generateLipSyncMock(
    avatarId: string,
    audioUrl: string
  ): Promise<LipSyncGenerationResult> {
    console.log(`[LipSync Mock] Generating for avatar ${avatarId}`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      videoUrl: `https://mock-lipsync.example.com/videos/${avatarId}/${Date.now()}.mp4`,
    };
  }

  /**
   * Generates subtitles from script text
   * Uses simple word-timing estimation; can be upgraded to Whisper ASR
   */
  private async generateSubtitles(
    script: string,
    audioUrl: string,
    language: string
  ): Promise<SubtitleGenerationResult> {
    console.log(`[Subtitles] Generating subtitles for ${language}`);

    // Generate VTT from script text with estimated timing
    const vttContent = this.generateVTTFromScript(script, language);

    try {
      // Upload VTT to Supabase Storage
      const supabase = this.supabase;
      const filename = `subtitles/${Date.now()}.vtt`;

      const { data, error } = await supabase.storage
        .from('audio')
        .upload(filename, vttContent, {
          contentType: 'text/vtt',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(data.path);

      return { subtitleUrl: urlData.publicUrl };
    } catch (error) {
      console.warn('Failed to upload subtitles, using mock URL:', error);
      return {
        subtitleUrl: `https://mock-storage.example.com/subtitles/${Date.now()}.vtt`,
      };
    }
  }

  /**
   * Generate WebVTT subtitle file from script text with estimated timing
   */
  private generateVTTFromScript(script: string, language: string): string {
    const words = script.split(/\s+/).filter(Boolean);
    const speakingRates: Record<string, number> = {
      en: 150, es: 160, fr: 150, de: 150, zh: 200, ja: 180, ko: 170,
    };
    const langCode = language.split('-')[0].toLowerCase();
    const wordsPerMinute = speakingRates[langCode] || 150;
    const secondsPerWord = 60 / wordsPerMinute;

    let vtt = 'WEBVTT\n\n';
    const chunkSize = 8; // words per subtitle line
    let currentTime = 0;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      const duration = Math.min(words.slice(i, i + chunkSize).length, chunkSize) * secondsPerWord;
      const startTime = this.formatVTTTime(currentTime);
      const endTime = this.formatVTTTime(currentTime + duration);

      vtt += `${startTime} --> ${endTime}\n${chunk}\n\n`;
      currentTime += duration;
    }

    return vtt;
  }

  private formatVTTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  /**
   * Composes the final video (mock for now — real implementation needs FFmpeg or cloud encoding)
   */
  private async composeFinalVideo(
    videoUrl: string,
    subtitleUrl: string,
    ratio: string,
    resolution: string
  ): Promise<CompositionResult> {
    console.log(`[Composition] Composing final video ${ratio} @ ${resolution}`);

    // For now, the lip-sync video IS the final output
    // In production, this would overlay subtitles, adjust ratio, etc.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      outputUrl: videoUrl,
      thumbnailUrl: videoUrl.replace('.mp4', '_thumb.jpg'),
    };
  }

  /**
   * Updates the video project status in the database
   */
  private async updateProjectStatus(
    projectId: string,
    status: VideoStatus,
    extra?: Record<string, unknown>
  ): Promise<void> {
    try {
      const realColumns = ['output_url', 'thumbnail_url', 'subtitle_url', 'duration', 'error_message'];
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      const metadataFields: Record<string, unknown> = {};
      if (extra) {
        for (const [key, value] of Object.entries(extra)) {
          if (realColumns.includes(key)) {
            updateData[key] = value;
          } else {
            metadataFields[key] = value;
          }
        }
      }

      if (Object.keys(metadataFields).length > 0) {
        updateData.metadata = metadataFields;
      }

      const { error } = await this.supabase
        .from('video_projects')
        .update(updateData)
        .eq('id', projectId);

      if (error) {
        throw new Error(`Failed to update project status: ${error.message}`);
      }

      console.log(`[DB] Updated project ${projectId} status to ${status}`);
    } catch (error) {
      console.error(
        `Failed to update project status in database:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

export const videoGenerationService = new VideoGenerationService();
