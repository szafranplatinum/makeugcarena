import type { CreditCost } from '@/types';

/** Video type labels */
export const VIDEO_TYPE_LABELS: Record<string, string> = {
  talking_head: 'Talking Head',
  hook: 'Hook Video',
  product_demo: 'Product Demo',
  broll: 'B-roll',
};

/** Video status labels and colors */
export const VIDEO_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  processing: { label: 'Processing', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  rendering: { label: 'Rendering', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100' },
};

/** Plan badge colors */
export const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  startup: 'bg-blue-100 text-blue-700',
  growth: 'bg-purple-100 text-purple-700',
  pro: 'bg-amber-100 text-amber-700',
  enterprise: 'bg-red-100 text-red-700',
};

/** Default credit costs */
export const DEFAULT_CREDIT_COSTS: CreditCost[] = [
  { action: 'talking_head', label: 'Talking Head Video', cost: 1, description: 'Standard talking head avatar video' },
  { action: 'hook_video', label: 'Hook Video', cost: 0.5, description: '5-10 second hook video clip' },
  { action: 'product_demo', label: 'Product Demo', cost: 2, description: 'Product in hand demo video' },
  { action: 'broll', label: 'B-roll Generation', cost: 0.5, description: 'B-roll supplementary footage' },
  { action: 'script_gen', label: 'AI Script', cost: 0.1, description: 'AI-generated script' },
  { action: 'image_gen', label: 'Image Generation', cost: 0.2, description: 'AI image generation' },
];

/** Supported languages */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
];

/** Video aspect ratios */
export const VIDEO_RATIOS = [
  { value: '9:16', label: '9:16 (Vertical)', desc: 'TikTok, Reels, Shorts' },
  { value: '16:9', label: '16:9 (Horizontal)', desc: 'YouTube, Website' },
  { value: '1:1', label: '1:1 (Square)', desc: 'Instagram, Facebook' },
];

/** Script tones */
export const SCRIPT_TONES = [
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'casual', label: 'Casual', emoji: '😊' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
  { value: 'friendly', label: 'Friendly', emoji: '🤝' },
  { value: 'urgent', label: 'Urgent', emoji: '🔥' },
  { value: 'luxury', label: 'Luxury', emoji: '✨' },
];
