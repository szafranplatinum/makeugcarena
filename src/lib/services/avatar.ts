import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AIAvatar } from '@/types';

/**
 * Voice information for avatars
 */
export interface Voice {
  id: string;
  name: string;
  language: string;
  accent?: string;
  provider: 'elevenlabs' | 'fish_audio' | 'google' | 'azure';
  sample_url?: string;
}

/**
 * Avatar with associated voices
 */
export interface AvatarWithVoices extends AIAvatar {
  available_voices?: Voice[];
}

/**
 * Filters for querying avatars
 */
export interface AvatarFilters {
  gender?: 'male' | 'female' | 'non_binary';
  ethnicity?: string;
  style?: 'professional' | 'casual' | 'creative' | 'lifestyle';
  language?: string;
  isPremium?: boolean;
  isActive?: boolean;
}

/**
 * AvatarService manages AI avatar operations
 *
 * Handles:
 * - Querying available avatars from database
 * - Filtering and sorting avatars
 * - Managing voice options per avatar
 * - Custom avatar generation (TODO)
 */
export class AvatarService {
  private supabase = createServerSupabaseClient();

  /**
   * Gets list of available avatars with optional filters
   */
  async getAvailableAvatars(filters?: AvatarFilters): Promise<AIAvatar[]> {
    try {
      let query = this.supabase
        .from('ai_avatars')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Apply filters
      if (filters) {
        if (filters.gender) {
          query = query.eq('gender', filters.gender);
        }
        if (filters.ethnicity) {
          query = query.eq('ethnicity', filters.ethnicity);
        }
        if (filters.style) {
          query = query.eq('style', filters.style);
        }
        if (filters.language) {
          // This requires JSON array containment - adjust based on schema
          query = query.contains('languages', [filters.language]);
        }
        if (filters.isPremium !== undefined) {
          query = query.eq('is_premium', filters.isPremium);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch avatars: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching avatars:', error);
      throw error;
    }
  }

  /**
   * Gets a single avatar by ID with all details
   */
  async getAvatarById(id: string): Promise<AvatarWithVoices | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_avatars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw new Error(`Failed to fetch avatar: ${error.message}`);
      }

      // Get associated voices
      const voices = await this.getAvatarVoices(id);

      return {
        ...(data as AIAvatar),
        available_voices: voices,
      };
    } catch (error) {
      console.error('Error fetching avatar by ID:', error);
      throw error;
    }
  }

  /**
   * Gets available voice options for an avatar
   */
  async getAvatarVoices(avatarId: string): Promise<Voice[]> {
    try {
      const { data, error } = await this.supabase
        .from('avatar_voices')
        .select('*')
        .eq('avatar_id', avatarId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn(`Failed to fetch voices for avatar ${avatarId}:`, error);
        // Return empty array instead of throwing
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching avatar voices:', error);
      return [];
    }
  }

  /**
   * Gets all voices available in the system
   */
  async getAllVoices(filters?: {
    language?: string;
    provider?: string;
  }): Promise<Voice[]> {
    try {
      let query = this.supabase
        .from('avatar_voices')
        .select('*')
        .eq('is_active', true)
        .order('language', { ascending: true });

      if (filters?.language) {
        query = query.eq('language', filters.language);
      }
      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch voices: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Searches avatars by name
   */
  async searchAvatars(query: string): Promise<AIAvatar[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_avatars')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(`Failed to search avatars: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching avatars:', error);
      throw error;
    }
  }

  /**
   * Gets popular/featured avatars
   */
  async getFeaturedAvatars(limit: number = 6): Promise<AIAvatar[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_avatars')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch featured avatars: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching featured avatars:', error);
      throw error;
    }
  }

  /**
   * TODO: Generates a custom avatar from an image
   *
   * This would integrate with an avatar generation API like:
   * - Avatar AI
   * - Synthesia
   * - HeyGen
   *
   * Implementation would:
   * 1. Accept an image URL or upload
   * 2. Send to avatar generation API
   * 3. Wait for processing
   * 4. Store generated avatar in database
   * 5. Make it available for video generation
   */
  async generateCustomAvatar(
    imageUrl: string,
    userId: string
  ): Promise<AvatarWithVoices> {
    // TODO: Implement custom avatar generation
    throw new Error('Custom avatar generation is not yet implemented');

    // Placeholder for future implementation:
    // 1. Validate image
    // 2. Call avatar generation API
    // 3. Store in database under user's account
    // 4. Return generated avatar with default voices
  }

  /**
   * Gets avatar statistics and metadata
   */
  async getAvatarStats(): Promise<{
    totalAvatars: number;
    totalVoices: number;
    activeAvatars: number;
    byGender: Record<string, number>;
    byStyle: Record<string, number>;
  }> {
    try {
      // Get total and active avatars
      const { count: totalAvatars } = await this.supabase
        .from('ai_avatars')
        .select('*', { count: 'exact', head: true });

      const { count: activeAvatars } = await this.supabase
        .from('ai_avatars')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get all avatars for detailed stats
      const avatars = await this.getAvailableAvatars();

      // Count by gender and style
      const byGender: Record<string, number> = {};
      const byStyle: Record<string, number> = {};

      avatars.forEach((avatar) => {
        byGender[avatar.gender] = (byGender[avatar.gender] || 0) + 1;
        byStyle[avatar.style] = (byStyle[avatar.style] || 0) + 1;
      });

      // Get total voices
      const { count: totalVoices } = await this.supabase
        .from('avatar_voices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        totalAvatars: totalAvatars || 0,
        totalVoices: totalVoices || 0,
        activeAvatars: activeAvatars || 0,
        byGender,
        byStyle,
      };
    } catch (error) {
      console.error('Error fetching avatar stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const avatarService = new AvatarService();
