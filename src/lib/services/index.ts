/**
 * Video Generation Services
 *
 * Central export point for all video generation related services.
 * Makes it easy to import services throughout the application.
 */

export {
  VideoGenerationService,
  videoGenerationService,
  type VideoGenerationInput,
  type VideoGenerationResult,
} from './video-generator';

export {
  ScriptAIService,
  scriptAIService,
  type ScriptGenerationInput,
  type ScriptGenerationResult,
} from './script-ai';

export {
  getTTSProvider,
  ElevenLabsTTSProvider,
  FishAudioTTSProvider,
  MockTTSProvider,
  type ITTSProvider,
  type TTSInput,
  type TTSResult,
} from './tts';

export {
  AvatarService,
  avatarService,
  type Voice,
  type AvatarWithVoices,
  type AvatarFilters,
} from './avatar';
