-- ============================================
-- MakeUGC Clone - Supabase Database Schema
-- ============================================

-- 启用必要扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户档案表 (扩展 Supabase Auth)
-- ============================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'startup', 'growth', 'pro', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'expired')),
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_monthly INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 自动创建 user_profile 的触发器 (当 auth.users 新增时)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. AI 头像表
-- ============================================
CREATE TABLE public.ai_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  preview_video_url TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'non_binary')),
  ethnicity TEXT NOT NULL CHECK (ethnicity IN ('asian', 'black', 'caucasian', 'hispanic', 'middle_eastern', 'mixed')),
  style TEXT NOT NULL CHECK (style IN ('professional', 'casual', 'creative', 'lifestyle')),
  age_range TEXT NOT NULL DEFAULT '20-30',
  languages TEXT[] NOT NULL DEFAULT ARRAY['en'],
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. 视频项目表
-- ============================================
CREATE TABLE public.video_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  type TEXT NOT NULL DEFAULT 'talking_head' CHECK (type IN ('talking_head', 'hook', 'product_demo', 'broll')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'rendering', 'completed', 'failed')),
  script TEXT NOT NULL DEFAULT '',
  avatar_id UUID REFERENCES public.ai_avatars(id) ON DELETE SET NULL,
  voice_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  ratio TEXT NOT NULL DEFAULT '9:16' CHECK (ratio IN ('16:9', '9:16', '1:1')),
  resolution TEXT NOT NULL DEFAULT '1080p' CHECK (resolution IN ('1080p', '4k')),
  duration INTEGER, -- seconds
  output_url TEXT,
  thumbnail_url TEXT,
  subtitle_url TEXT,
  credits_used NUMERIC(5,2) NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. 脚本表
-- ============================================
CREATE TABLE public.scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Script',
  content TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en',
  tone TEXT NOT NULL DEFAULT 'professional',
  word_count INTEGER NOT NULL DEFAULT 0,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. 订阅计划配置表 (管理端管理)
-- ============================================
CREATE TABLE public.plan_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug IN ('free', 'startup', 'growth', 'pro', 'enterprise')),
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  credits_monthly INTEGER NOT NULL DEFAULT 0,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 初始化计划数据
INSERT INTO public.plan_configs (name, slug, price_monthly, price_yearly, credits_monthly, features, is_popular, sort_order) VALUES
  ('Free', 'free', 0, 0, 1, ARRAY['1 AI video/month', 'Basic avatars', '720p export'], FALSE, 0),
  ('Startup', 'startup', 49, 470, 5, ARRAY['5 AI videos/month', '300+ avatars', '1080p export', 'AI script generation', 'Sora 2 video gen'], FALSE, 1),
  ('Growth', 'growth', 69, 662, 10, ARRAY['10 AI videos/month', '300+ avatars', '1080p export', 'AI script generation', 'Batch mode', 'B-roll generator'], TRUE, 2),
  ('Pro', 'pro', 119, 1142, 20, ARRAY['20 AI videos/month', '300+ avatars', '4K export', 'Product in hand', 'Custom avatars', 'Video Agent', 'PDF to Video'], FALSE, 3),
  ('Enterprise', 'enterprise', 0, 0, 100, ARRAY['Custom video credits', 'ElevenLabs voices', 'API access', 'Dedicated support', 'Done-For-You service'], FALSE, 4);

-- ============================================
-- 6. 信用交易记录表
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL, -- positive=add, negative=consume
  action TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  video_project_id UUID REFERENCES public.video_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. 信用消耗配置表 (管理端管理)
-- ============================================
CREATE TABLE public.credit_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  cost NUMERIC(5,2) NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

INSERT INTO public.credit_costs (action, label, cost, description) VALUES
  ('talking_head', 'Talking Head Video', 1, 'Standard talking head avatar video'),
  ('hook_video', 'Hook Video', 0.5, '5-10 second hook video clip'),
  ('product_demo', 'Product Demo', 2, 'Product in hand demo video'),
  ('broll', 'B-roll Generation', 0.5, 'B-roll supplementary footage'),
  ('script_gen', 'AI Script', 0.1, 'AI-generated script'),
  ('image_gen', 'Image Generation', 0.2, 'AI image generation');

-- ============================================
-- 8. 系统设置表 (管理端管理)
-- ============================================
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.system_settings (key, value, description) VALUES
  ('site_name', '"MakeUGC Clone"', 'Site display name'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('max_video_duration', '120', 'Max video duration in seconds'),
  ('default_language', '"en"', 'Default language'),
  ('supported_languages', '["en","zh","ja","ko","es","fr","de","pt","ar","hi"]', 'Supported languages'),
  ('video_models', '{"sora2": true, "veo3": true, "kling": true}', 'Enabled video generation models');

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- user_profiles: 用户只能读写自己的, admin 可读写所有
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can update all profiles" ON public.user_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ai_avatars: 所有人可读, admin 可写
CREATE POLICY "Anyone can view active avatars" ON public.ai_avatars FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage avatars" ON public.ai_avatars FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- video_projects: 用户只读写自己的
CREATE POLICY "Users can manage own projects" ON public.video_projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all projects" ON public.video_projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- scripts: 用户只读写自己的
CREATE POLICY "Users can manage own scripts" ON public.scripts FOR ALL USING (auth.uid() = user_id);

-- plan_configs: 所有人可读, admin 可写
CREATE POLICY "Anyone can view plans" ON public.plan_configs FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage plans" ON public.plan_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- credit_transactions: 用户读自己的, admin 读所有
CREATE POLICY "Users can view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.credit_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- credit_costs: 所有人可读, admin 可写
CREATE POLICY "Anyone can view credit costs" ON public.credit_costs FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage credit costs" ON public.credit_costs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- system_settings: admin only
CREATE POLICY "Admins can manage settings" ON public.system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX idx_video_projects_user_id ON public.video_projects(user_id);
CREATE INDEX idx_video_projects_status ON public.video_projects(status);
CREATE INDEX idx_scripts_user_id ON public.scripts(user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_ai_avatars_active ON public.ai_avatars(is_active, sort_order);

-- ============================================
-- 2.5 AI 头像语音表
-- ============================================
CREATE TABLE public.avatar_voices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avatar_id UUID REFERENCES public.ai_avatars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  accent TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('elevenlabs', 'fish_audio', 'google', 'azure')),
  provider_voice_id TEXT NOT NULL,
  sample_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- avatar_voices RLS
ALTER TABLE public.avatar_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active voices" ON public.avatar_voices FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage voices" ON public.avatar_voices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE INDEX idx_avatar_voices_avatar_id ON public.avatar_voices(avatar_id);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON public.video_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON public.scripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
