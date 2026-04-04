// ============================================
// MakeUGC Clone - 核心类型定义
// ============================================

// --- 用户与角色 ---
export type UserRole = 'user' | 'admin' | 'super_admin';

export type SubscriptionPlan = 'free' | 'startup' | 'growth' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  credits_remaining: number;
  credits_monthly: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

// --- AI 头像 ---
export type AvatarGender = 'male' | 'female' | 'non_binary';
export type AvatarEthnicity = 'asian' | 'black' | 'caucasian' | 'hispanic' | 'middle_eastern' | 'mixed';
export type AvatarStyle = 'professional' | 'casual' | 'creative' | 'lifestyle';

export interface AIAvatar {
  id: string;
  name: string;
  thumbnail_url: string;
  preview_video_url: string | null;
  gender: AvatarGender;
  ethnicity: AvatarEthnicity;
  style: AvatarStyle;
  age_range: string; // e.g. "20-30"
  languages: string[];
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// --- 视频项目 ---
export type VideoStatus = 'draft' | 'processing' | 'rendering' | 'completed' | 'failed';
export type VideoRatio = '16:9' | '9:16' | '1:1';
export type VideoResolution = '1080p' | '4k';
export type VideoType = 'talking_head' | 'hook' | 'product_demo' | 'broll';

export interface VideoProject {
  id: string;
  user_id: string;
  title: string;
  type: VideoType;
  status: VideoStatus;
  script: string;
  avatar_id: string | null;
  avatar?: AIAvatar;
  voice_id: string | null;
  language: string;
  ratio: VideoRatio;
  resolution: VideoResolution;
  duration: number | null; // seconds
  output_url: string | null;
  thumbnail_url: string | null;
  subtitle_url: string | null;
  credits_used: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// --- 脚本 ---
export interface Script {
  id: string;
  user_id: string;
  title: string;
  content: string;
  language: string;
  tone: string; // e.g. 'professional', 'casual', 'energetic'
  word_count: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

// --- 订阅计划配置 ---
export interface PlanConfig {
  id: string;
  name: string;
  slug: SubscriptionPlan;
  price_monthly: number;
  price_yearly: number;
  credits_monthly: number;
  features: string[];
  is_popular: boolean;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  is_active: boolean;
  sort_order: number;
}

// --- 信用系统 ---
export type CreditAction = 'talking_head' | 'hook_video' | 'product_demo' | 'broll' | 'script_gen' | 'image_gen';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number; // positive = add, negative = consume
  action: CreditAction | 'subscription_renewal' | 'admin_adjustment' | 'purchase';
  description: string;
  video_project_id: string | null;
  created_at: string;
}

export interface CreditCost {
  action: CreditAction;
  label: string;
  cost: number; // credits consumed
  description: string;
}

// --- 管理端统计 ---
export interface AdminStats {
  total_users: number;
  active_subscribers: number;
  total_videos_generated: number;
  total_revenue: number;
  new_users_today: number;
  videos_today: number;
  credits_consumed_today: number;
}

// --- API 响应 ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// --- 分页 ---
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
