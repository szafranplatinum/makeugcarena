# MakeUGC Clone — AI Video Ad Platform

> **v1.0.0** | 2026-04-04

AI 驱动的 UGC 视频广告平台，对标 MakeUGC.ai。用户可以编写脚本、选择 AI 头像、一键生成专业级 UGC 风格视频广告。

## 文档

- [CHANGELOG.md](./CHANGELOG.md) — 开发日志与版本记录
- [docs/FEATURES.md](./docs/FEATURES.md) — 功能文档 (架构、数据库、API 端点)
- [docs/API-SETTINGS.md](./docs/API-SETTINGS.md) — API 配置指南 (各服务商接入)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) — 部署指南 (本地开发 + 生产部署)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (全栈)
- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Payment**: Stripe (Subscriptions + Credits)
- **State**: Zustand + React Context
- **AI Services**: OpenAI / Claude (脚本), ElevenLabs (TTS), Wav2Lip (唇音同步)

## Project Structure

```
make-ugc-clone/
├── src/
│   ├── app/
│   │   ├── (auth)/             # 登录 / 注册
│   │   ├── admin/              # 管理端后台 (深色侧边栏)
│   │   │   └── (dashboard)/    # 用户管理 / 头像 / 计划 / 信用 / 设置 / 分析 / 权限
│   │   ├── dashboard/          # 用户端后台 (白色侧边栏)
│   │   │   └── (user)/         # 创建视频 / 项目 / 头像 / 脚本 / 账单 / 设置
│   │   ├── api/
│   │   │   ├── admin/          # 管理端 API (users/avatars/credits/settings/analytics)
│   │   │   ├── auth/           # 认证 API
│   │   │   ├── avatars/        # 头像 API
│   │   │   ├── billing/        # Stripe 支付 (checkout/portal/webhook/plans/usage)
│   │   │   ├── scripts/        # 脚本 CRUD + AI 生成
│   │   │   └── videos/         # 视频 CRUD + 生成 + 状态轮询
│   │   └── auth/callback/      # OAuth 回调
│   ├── components/
│   │   ├── ui/                 # 15 个共享 UI 组件
│   │   ├── admin/              # 管理端组件 (Sidebar/Header)
│   │   └── dashboard/          # 用户端组件 (Sidebar/Header)
│   ├── hooks/                  # 7 个自定义 Hooks
│   ├── lib/
│   │   ├── supabase/           # Supabase 客户端 (browser/server/middleware)
│   │   ├── services/           # 核心服务 (视频生成/脚本AI/TTS/头像)
│   │   ├── queue/              # 任务队列 (MVP 内存队列)
│   │   ├── providers/          # React Context Providers
│   │   ├── stripe.ts           # Stripe 配置
│   │   ├── api-client.ts       # 类型安全 API 客户端
│   │   ├── constants.ts        # 常量配置
│   │   └── utils.ts            # 工具函数
│   ├── types/                  # TypeScript 类型定义
│   └── middleware.ts           # 路由守卫 (认证 + 角色)
├── supabase/
│   └── schema.sql              # 完整数据库 Schema (8 表 + RLS + 触发器)
└── package.json
```

## Quick Start

### 1. 安装依赖

```bash
cd make-ugc-clone
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入以下配置：

```env
# Supabase (从 supabase.com 项目设置获取)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Stripe (从 stripe.com dashboard 获取)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI APIs (按需配置)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中执行 `supabase/schema.sql`。

这会创建：
- `user_profiles` — 用户档案 (扩展 Auth)
- `ai_avatars` — AI 头像库
- `video_projects` — 视频项目
- `scripts` — 脚本
- `plan_configs` — 订阅计划配置 (含初始数据)
- `credit_transactions` — 信用交易记录
- `credit_costs` — 信用消耗配置 (含初始数据)
- `system_settings` — 系统设置 (含初始数据)

自动包含 RLS 安全策略和索引。

### 4. 配置 Stripe Webhook (本地开发)

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问：
- 首页: http://localhost:3000
- 用户后台: http://localhost:3000/dashboard
- 管理后台: http://localhost:3000/admin

### 6. 创建管理员账号

注册一个普通账号后，在 Supabase Dashboard 手动将 `user_profiles.role` 改为 `super_admin`。

## 双后台架构

### 管理端后台 `/admin` (深色主题)

| 页面 | 路由 | 功能 |
|------|------|------|
| Dashboard | `/admin` | 统计总览、最新用户、最新视频 |
| Analytics | `/admin/analytics` | KPI、增长趋势、计划分布、收入 |
| Users | `/admin/users` | 用户搜索/筛选/编辑/封禁 |
| Avatars | `/admin/avatars` | 头像增删改查、上下架 |
| Videos | `/admin/videos` | 所有视频管理、重新处理 |
| Scripts | `/admin/scripts` | 所有脚本管理 |
| Plans | `/admin/plans` | 订阅计划配置、价格、Stripe 对接 |
| Credits | `/admin/credits` | 信用消耗配置、手动调整 |
| Settings | `/admin/settings` | 站点设置、AI 模型开关、维护模式 |
| Permissions | `/admin/permissions` | 角色管理、权限矩阵、API Key |
| Notifications | `/admin/notifications` | 通知推送管理 |

### 用户端后台 `/dashboard` (白色主题)

| 页面 | 路由 | 功能 |
|------|------|------|
| Overview | `/dashboard` | 统计、快捷操作、最近项目 |
| Create Video | `/dashboard/create` | 4步创建流程 (脚本→头像→设置→生成) |
| My Projects | `/dashboard/projects` | 视频项目管理 |
| AI Avatars | `/dashboard/avatars` | 浏览选择 300+ 头像 |
| Scripts | `/dashboard/scripts` | 脚本管理 + AI 生成 |
| Billing | `/dashboard/billing` | 订阅管理、升级、支付历史 |
| Settings | `/dashboard/settings` | 个人设置、安全、通知偏好 |

## API Endpoints

### Auth
- `GET/PATCH /api/auth/profile` — 用户档案
- `GET /auth/callback` — OAuth 回调

### Videos
- `GET/POST /api/videos` — 视频列表/创建
- `GET/PATCH/DELETE /api/videos/[id]` — 单个视频操作
- `POST /api/videos/generate` — 触发视频生成
- `GET /api/videos/[id]/status` — 生成状态轮询

### Scripts
- `GET/POST /api/scripts` — 脚本 CRUD
- `POST /api/scripts/generate` — AI 脚本生成

### Avatars
- `GET /api/avatars` — 头像列表 (公开)
- `GET/PATCH/DELETE /api/avatars/[id]` — 单个头像

### Billing
- `POST /api/billing/checkout` — 创建 Stripe Checkout
- `POST /api/billing/portal` — 客户管理门户
- `POST /api/billing/webhook` — Stripe Webhook
- `GET /api/billing/plans` — 获取计划列表
- `GET /api/billing/usage` — 信用使用记录

### Admin
- `GET/PATCH /api/admin/users` — 用户管理
- `GET/POST /api/admin/avatars` — 头像管理
- `GET/PATCH/POST /api/admin/credits` — 信用配置 + 手动调整
- `GET/PATCH /api/admin/settings` — 系统设置
- `GET /api/admin/analytics` — 分析数据

## 视频生成流程

```
用户提交 → 扣除信用 → 加入队列 → TTS 语音合成 → 唇音同步 → 字幕生成 → 合成渲染 → 完成
              ↓              ↓           ↓             ↓          ↓            ↓
          credit_tx    status:processing  ElevenLabs   Wav2Lip   Whisper    FFmpeg
```

当前使用 Mock 实现，每个阶段标注了 TODO 用于接入真实 AI API。

## 信用系统

| 操作 | 消耗信用 |
|------|---------|
| Talking Head 视频 | 1.0 |
| Hook 视频 | 0.5 |
| Product Demo | 2.0 |
| B-roll 生成 | 0.5 |
| AI 脚本生成 | 0.1 |
| 图像生成 | 0.2 |

## Development Roadmap

- [x] P0: 项目骨架 + 双后台架构
- [x] P0: 用户认证 (邮箱 + OAuth)
- [x] P0: 管理端后台 (11 个页面)
- [x] P0: 用户端后台 (7 个页面)
- [x] P0: Stripe 订阅支付集成
- [x] P0: 信用系统
- [x] P0: 视频生成服务骨架
- [x] P0: 15 个共享 UI 组件
- [x] P0: 完整 API 层 (25+ endpoints)
- [x] P0: 全页面真实数据对接 (Supabase)
- [x] P0: API Key 加密存储 + 管理后台配置
- [x] P0: 中英文国际化 (i18n)
- [ ] P1: 接入真实 AI API (TTS/唇音同步/视频生成)
- [ ] P1: 文件存储 (Supabase Storage / S3)
- [ ] P1: 批量生成模式
- [ ] P2: Product in Hand 功能
- [ ] P2: Video Agent 自动化
- [ ] P2: 团队协作
