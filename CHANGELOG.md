# Changelog

All notable changes to the MakeUGC Clone project will be documented in this file.

## [v1.0.0] - 2026-04-04

### Project Initialization

- Initialized Next.js 14 (App Router) + TypeScript + Tailwind CSS project
- Configured Supabase (PostgreSQL + Auth + Storage) as backend
- Set up Stripe integration for subscriptions and payments
- Implemented React Context-based i18n with Chinese and English locales

### Database & Auth

- Designed and implemented 9 tables with full schema (`supabase/schema.sql`):
  `user_profiles`, `ai_avatars`, `avatar_voices`, `video_projects`, `scripts`, `plan_configs`, `credit_transactions`, `credit_costs`, `system_settings`
- Enabled Row Level Security (RLS) on all tables with fine-grained policies
- Implemented `service_role` admin client pattern to bypass RLS recursion in admin APIs
- Auto-create `user_profiles` via Postgres trigger on auth signup
- Role-based middleware route guard (user / admin / super_admin)

### Admin Dashboard (11 pages)

- `/admin` — Overview dashboard with real-time stats, recent users, recent videos
- `/admin/analytics` — KPI charts (daily signups, videos, credits), plan distribution pie chart, top users
- `/admin/users` — User management with search, filter, role editing
- `/admin/avatars` — Avatar CRUD with active/inactive toggle
- `/admin/voices` — Voice library management
- `/admin/videos` — All videos management
- `/admin/scripts` — All scripts management
- `/admin/plans` — Subscription plan configuration with Stripe price ID binding
- `/admin/credits` — Credit cost configuration and manual adjustment
- `/admin/settings` — System settings with 6 tabs: Script AI, TTS, Lip-sync, Storage, Payment, General
- `/admin/permissions` — Role and permission matrix management

### User Dashboard (7 pages)

- `/dashboard` — User overview with stats, usage chart (Recharts AreaChart), recent projects
- `/dashboard/create` — 4-step video creation wizard (Script → Avatar → Settings → Generate)
- `/dashboard/projects` — Video project list with status/type filters, pagination, delete
- `/dashboard/avatars` — Browse 300+ AI avatars with gender/style filters
- `/dashboard/scripts` — Script management + AI generation
- `/dashboard/billing` — Subscription management, plan upgrade, payment history
- `/dashboard/settings` — Profile settings (name, language, email read-only)

### API Layer (25+ endpoints)

- Auth: `GET/PATCH /api/auth/profile`, `GET /api/auth/me`
- Videos: full CRUD + generate + status polling
- Scripts: CRUD + AI generation via OpenAI/Anthropic
- Avatars: public listing + admin management
- Billing: Stripe Checkout, Customer Portal, Webhook, Plans, Usage, Credits
- Admin: Users, Avatars, Credits, Settings, Analytics, API Keys, Seed, Setup
- Dashboard: Stats endpoint with parallel queries

### API Key Management System

- AES-256-GCM encryption for sensitive API keys stored in `system_settings`
- Admin UI for configuring: OpenAI, Anthropic, ElevenLabs, Fish Audio, HeyGen, Simli, AWS S3, Stripe
- Connection test buttons for each provider with detailed error reporting
- Masked display of saved keys (first 4 + last 4 characters)

### UI Components (15+)

- Shared: Button, Input, Select, Textarea, Card, StatsCard, Table, Modal, Badge, StatusBadge, Pagination, Tabs, Toggle, EmptyState
- Admin: AdminSidebar (dark theme), AdminHeader
- Dashboard: UserSidebar (light theme), UserHeader

### Core Services

- `ApiKeyService` — Encrypted API key CRUD with Supabase
- `ScriptAIService` — AI script generation (OpenAI / Anthropic)
- `TTSService` — Text-to-speech (ElevenLabs / Fish Audio / Mock)
- `VideoGeneratorService` — Video generation pipeline with queue
- `AvatarService` — Avatar management

### Bug Fixes

- Fixed hydration error from `toLocaleDateString()` mismatch between server and client
- Fixed Webpack cache corruption (`__webpack_modules__[moduleId] is not a function`)
- Fixed missing i18n keys for billing page (added 22 translation keys)
- Fixed profile API 500 error caused by RLS recursion on `user_profiles`
- Fixed admin dashboard data fetching (server components can't forward cookies to own API routes)
- Fixed dashboard delete URL (was `/api/projects/` should be `/api/videos/`)
- Fixed admin settings page slow loading (sequential → parallel API calls)
- Fixed ElevenLabs API test returning generic "Connection failed" (now shows HTTP status + error detail)

### Performance

- Admin settings page: parallel loading of API keys and general settings via `Promise.all()`
- Admin dashboard: parallel Supabase queries via `Promise.all()` for stats
- Dashboard stats API: parallel queries for user stats, recent projects, usage chart

### Security

- All sensitive API keys encrypted at rest with AES-256-GCM
- ENCRYPTION_SECRET derived via SHA-256 to 32-byte key
- Random IV per encryption operation
- Service role key used only in server-side API routes
- RLS enforced on all tables, bypassed only via admin client where necessary
