/**
 * API Key Service
 *
 * Provides runtime access to decrypted API keys stored in the database.
 * Keys are encrypted at rest using AES-256-GCM.
 *
 * Usage:
 *   const openaiKey = await apiKeyService.get('openai_api_key');
 *   const config = await apiKeyService.getAll();
 */
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { decrypt, encrypt, maskApiKey, isValidApiKey } from '@/lib/crypto';

// API key identifiers stored in system_settings
export const API_KEY_IDS = {
  // Script Generation
  OPENAI_API_KEY: 'api_key_openai',
  OPENAI_MODEL: 'api_config_openai_model',
  OPENAI_PROVIDER: 'api_config_script_provider', // 'openai' | 'anthropic'
  ANTHROPIC_API_KEY: 'api_key_anthropic',
  ANTHROPIC_MODEL: 'api_config_anthropic_model',

  // TTS (Text-to-Speech)
  ELEVENLABS_API_KEY: 'api_key_elevenlabs',
  ELEVENLABS_DEFAULT_VOICE: 'api_config_elevenlabs_voice',
  FISH_AUDIO_API_KEY: 'api_key_fish_audio',
  TTS_PROVIDER: 'api_config_tts_provider', // 'elevenlabs' | 'fish_audio' | 'mock'

  // Lip-Sync / Video Generation
  HEYGEN_API_KEY: 'api_key_heygen',
  SIMLI_API_KEY: 'api_key_simli',
  LIPSYNC_PROVIDER: 'api_config_lipsync_provider', // 'heygen' | 'simli' | 'mock'

  // Storage
  STORAGE_PROVIDER: 'api_config_storage_provider', // 'supabase' | 's3'
  AWS_ACCESS_KEY_ID: 'api_key_aws_access',
  AWS_SECRET_ACCESS_KEY: 'api_key_aws_secret',
  AWS_S3_BUCKET: 'api_config_s3_bucket',
  AWS_S3_REGION: 'api_config_s3_region',

  // Payment
  STRIPE_SECRET_KEY: 'api_key_stripe_secret',
  STRIPE_PUBLISHABLE_KEY: 'api_key_stripe_publishable',
  STRIPE_WEBHOOK_SECRET: 'api_key_stripe_webhook',
} as const;

// Keys that should be encrypted (contain sensitive secrets)
const ENCRYPTED_KEYS = new Set<string>([
  API_KEY_IDS.OPENAI_API_KEY,
  API_KEY_IDS.ANTHROPIC_API_KEY,
  API_KEY_IDS.ELEVENLABS_API_KEY,
  API_KEY_IDS.FISH_AUDIO_API_KEY,
  API_KEY_IDS.HEYGEN_API_KEY,
  API_KEY_IDS.SIMLI_API_KEY,
  API_KEY_IDS.AWS_ACCESS_KEY_ID,
  API_KEY_IDS.AWS_SECRET_ACCESS_KEY,
  API_KEY_IDS.STRIPE_SECRET_KEY,
  API_KEY_IDS.STRIPE_PUBLISHABLE_KEY,
  API_KEY_IDS.STRIPE_WEBHOOK_SECRET,
]);

export type ApiKeyId = (typeof API_KEY_IDS)[keyof typeof API_KEY_IDS];

class ApiKeyService {
  /**
   * Gets a single decrypted API key or config value
   */
  async get(keyId: ApiKeyId): Promise<string | null> {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', keyId)
      .single();

    if (error || !data) return null;

    const raw = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
    // Remove surrounding quotes if JSON string
    const value = raw.replace(/^"|"$/g, '');

    if (!value || value === 'null' || value === '') return null;

    // Decrypt if this is a sensitive key
    if (ENCRYPTED_KEYS.has(keyId)) {
      try {
        return decrypt(value);
      } catch {
        // If decryption fails, the value might not be encrypted yet
        console.warn(`Failed to decrypt ${keyId}, returning raw value`);
        return value;
      }
    }

    return value;
  }

  /**
   * Gets all API keys and config values (keys are decrypted)
   */
  async getAll(): Promise<Record<string, string | null>> {
    const supabase = createAdminSupabaseClient();
    const allKeyIds = Object.values(API_KEY_IDS);

    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', allKeyIds);

    if (error) {
      console.error('Failed to fetch API keys:', error.message);
      return {};
    }

    const result: Record<string, string | null> = {};

    // Initialize all keys as null
    for (const keyId of allKeyIds) {
      result[keyId] = null;
    }

    // Fill with actual values
    for (const row of data || []) {
      const raw = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
      const value = raw.replace(/^"|"$/g, '');

      if (!value || value === 'null' || value === '') {
        result[row.key] = null;
        continue;
      }

      if (ENCRYPTED_KEYS.has(row.key as ApiKeyId)) {
        try {
          result[row.key] = decrypt(value);
        } catch {
          result[row.key] = value;
        }
      } else {
        result[row.key] = value;
      }
    }

    return result;
  }

  /**
   * Gets all API keys masked for display in admin UI
   */
  async getAllMasked(): Promise<Record<string, string>> {
    const supabase = createAdminSupabaseClient();
    const allKeyIds = Object.values(API_KEY_IDS);

    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', allKeyIds);

    if (error) {
      console.error('Failed to fetch API keys:', error.message);
      return {};
    }

    const result: Record<string, string> = {};

    for (const keyId of allKeyIds) {
      result[keyId] = '';
    }

    for (const row of data || []) {
      const raw = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
      const value = raw.replace(/^"|"$/g, '');

      if (!value || value === 'null' || value === '') {
        result[row.key] = '';
        continue;
      }

      if (ENCRYPTED_KEYS.has(row.key as ApiKeyId)) {
        try {
          const decrypted = decrypt(value);
          result[row.key] = maskApiKey(decrypted);
        } catch {
          result[row.key] = '(encrypted - unable to decrypt)';
        }
      } else {
        result[row.key] = value;
      }
    }

    return result;
  }

  /**
   * Saves a single API key or config value (encrypts if sensitive)
   */
  async set(keyId: ApiKeyId, value: string): Promise<void> {
    const supabase = createAdminSupabaseClient();

    let storedValue: string;
    if (ENCRYPTED_KEYS.has(keyId) && isValidApiKey(value)) {
      storedValue = encrypt(value);
    } else {
      storedValue = value;
    }

    const { error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: keyId,
          value: JSON.stringify(storedValue),
          description: `API configuration: ${keyId}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      throw new Error(`Failed to save ${keyId}: ${error.message}`);
    }
  }

  /**
   * Saves multiple API keys/configs at once
   */
  async setMany(entries: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined && value !== '') {
        await this.set(key as ApiKeyId, value);
      }
    }
  }

  /**
   * Check if a specific API integration is configured
   */
  async isConfigured(keyId: ApiKeyId): Promise<boolean> {
    const value = await this.get(keyId);
    return value !== null && isValidApiKey(value);
  }
}

export const apiKeyService = new ApiKeyService();
