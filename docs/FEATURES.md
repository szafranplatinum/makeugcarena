# 功能文档

MakeUGC Clone 是一个 AI 驱动的 UGC 视频广告生成平台，对标 MakeUGC.ai。

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 14 App Router + React 18 + TypeScript + Tailwind   │
├──────────────────────┬──────────────────────────────────────┤
│   用户端 /dashboard   │         管理端 /admin                │
│   (白色主题)          │         (深色主题)                    │
├──────────────────────┴──────────────────────────────────────┤
│                    API Routes (25+)                          │
│  /api/auth  /api/videos  /api/scripts  /api/billing  ...    │
├─────────────────────────────────────────────────────────────┤
│                    Core Services                             │
│  ScriptAI | TTS | VideoGenerator | ApiKeyService | Stripe   │
├──────────────┬──────────────┬───────────────────────────────┤
│   Supabase   │    Stripe    │      AI APIs                  │
│  PostgreSQL  │  Payments    │  OpenAI / Anthropic           │
│  Auth + RLS  │  Subscriptions│ ElevenLabs / Fish Audio      │
│  Storage     │  Webhook     │  HeyGen / Simli               │
└──────────────┴──────────────┴───────────────────────────────┘
```

## 用户认证

### 注册 / 登录

- 支持邮箱 + 密码注册/登录
- 支持 OAuth 第三方登录 (Google, GitHub 等，通过 Supabase Auth)
- 注册自动创建 `user_profiles` (Postgres 触发器)
- 默认角色: `user`，默认计划: `free`

### 路由守卫

中间件 (`src/middleware.ts`) 自动处理：
- 未登录用户 → 重定向到 `/login`
- 已登录用户访问 `/login` → 重定向到 `/dashboard`
- 非管理员访问 `/admin` → 重定向到 `/dashboard`
- 管理员角色: `admin`, `super_admin`

### 角色权限

| 角色 | 用户端 | 管理端 | 用户管理 | 系统设置 |
|------|--------|--------|----------|----------|
| user | ✅ | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ❌ |
| super_admin | ✅ | ✅ | ✅ | ✅ |

## 视频生成流程

### 4 步创建向导 (`/dashboard/create`)

1. **编写脚本** — 手动输入或 AI 自动生成
2. **选择头像** — 从 300+ AI 数字人中选择
3. **配置设置** — 语言、比例(16:9/9:16/1:1)、分辨率(1080p/4K)、语音
4. **生成视频** — 提交后进入队列处理

### 生成管线

```
提交请求 → 扣除积分 → 加入队列 → TTS 语音合成 → 口型同步 → 字幕生成 → 视频合成 → 完成
                                    ↓              ↓           ↓          ↓
                                ElevenLabs      HeyGen      Whisper    FFmpeg
                                Fish Audio      Simli
```

### 视频类型

| 类型 | 说明 | 积分消耗 |
|------|------|---------|
| Talking Head | 标准 AI 头像说话视频 | 1.0 |
| Hook | 5-10秒开头吸引视频 | 0.5 |
| Product Demo | 产品展示视频 | 2.0 |
| B-roll | 补充素材 | 0.5 |

### 视频状态

`draft` → `processing` → `rendering` → `completed` / `failed`

前端通过轮询 `GET /api/videos/[id]/status` 获取实时进度。

## 积分系统

### 积分获取

- 注册赠送: 根据计划等级
- 月度重置: 每月按计划配额重置
- 手动调整: 管理员可手动增减

### 积分消耗

| 操作 | 消耗积分 |
|------|---------|
| Talking Head 视频 | 1.0 |
| Hook 视频 | 0.5 |
| Product Demo | 2.0 |
| B-roll 生成 | 0.5 |
| AI 脚本生成 | 0.1 |
| 图像生成 | 0.2 |

所有消耗记录在 `credit_transactions` 表中，用户可在账单页面查看。

## 订阅计划

| 计划 | 月费 | 年费 | 月积分 | 特性 |
|------|------|------|--------|------|
| Free | $0 | $0 | 1 | 基础头像, 720p |
| Startup | $49 | $470 | 5 | 300+ 头像, 1080p, AI 脚本 |
| Growth | $69 | $662 | 10 | 批量模式, B-roll 生成 |
| Pro | $119 | $1,142 | 20 | 4K, Product in Hand, 自定义头像 |
| Enterprise | 定制 | 定制 | 100 | API 接入, 专属支持 |

通过 Stripe Checkout 处理支付，Stripe Customer Portal 管理订阅。

## 管理后台功能

### 仪表盘 (`/admin`)

- 用户总数及各计划分布
- 视频总数
- 最近注册用户 (5条)
- 最近生成视频 (5条)
- 所有数据通过 `createAdminSupabaseClient()` 直接查询 (绕过 RLS)

### 数据分析 (`/admin/analytics`)

- 时间段选择: 7天 / 30天 / 90天
- 日注册趋势 (AreaChart)
- 日视频生成趋势 (AreaChart)
- 积分消耗趋势 (AreaChart)
- 计划分布 (PieChart)
- 活跃用户排行

### API 配置 (`/admin/settings`)

6 个配置标签页:
1. **脚本 AI** — OpenAI / Anthropic 配置 + 连接测试
2. **语音合成** — ElevenLabs / Fish Audio 配置 + 连接测试
3. **口型同步** — HeyGen / Simli 配置
4. **存储** — Supabase Storage / AWS S3 配置
5. **支付** — Stripe 密钥配置
6. **通用设置** — 站点名称、语言、维护模式、最大视频时长

所有敏感 API key 通过 AES-256-GCM 加密存储。

## 国际化 (i18n)

基于 React Context 的多语言支持:

- 支持语言: 中文 (zh), English (en)
- 翻译文件: `src/lib/i18n/locales/{zh,en}.json`
- 用户可在设置页面切换语言
- 覆盖: 通用词汇、导航、仪表盘、项目、头像、脚本、账单、设置等模块

## 数据库设计

### 表结构

| 表名 | 说明 | RLS |
|------|------|-----|
| `user_profiles` | 用户档案 (扩展 Supabase Auth) | 用户读写自己，admin 读写全部 |
| `ai_avatars` | AI 头像库 | 所有人可读活跃头像，admin 全权 |
| `avatar_voices` | 头像关联语音 | 所有人可读活跃语音，admin 全权 |
| `video_projects` | 视频项目 | 用户管理自己的，admin 可读全部 |
| `scripts` | 脚本 | 用户管理自己的 |
| `plan_configs` | 订阅计划配置 | 所有人可读，admin 可写 |
| `credit_transactions` | 积分交易记录 | 用户读自己的，admin 读全部 |
| `credit_costs` | 积分消耗配置 | 所有人可读，admin 可写 |
| `system_settings` | 系统设置 (含加密API key) | 仅 admin |

### RLS 递归问题

admin 相关的 RLS 策略使用 `EXISTS (SELECT 1 FROM user_profiles WHERE ...)` 子查询判断角色。这会导致 RLS 递归：查询 `user_profiles` 时需要检查 RLS，而 RLS 又需要查询 `user_profiles`。

**解决方案**: 在 API 路由中使用 `createAdminSupabaseClient()` (service_role) 执行数据库操作，仅使用 `createServerSupabaseClient()` 获取当前用户身份 (`getUser()`)。

```typescript
// 正确模式
const supabase = createServerSupabaseClient();       // 仅用于 auth
const adminDb = createAdminSupabaseClient();          // 用于数据库查询 (绕过 RLS)

const { data: { user } } = await supabase.auth.getUser();
const { data } = await adminDb.from('user_profiles').select('*').eq('id', user.id).single();
```

## API 端点一览

### 认证

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/auth/profile` | 获取当前用户档案 |
| PATCH | `/api/auth/profile` | 更新用户档案 (名称、语言) |
| GET | `/api/auth/me` | 获取当前用户基础信息 |
| GET | `/auth/callback` | Supabase OAuth 回调 |

### 视频

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/videos` | 视频列表 (分页、过滤) |
| POST | `/api/videos` | 创建视频项目 |
| GET | `/api/videos/[id]` | 获取单个视频 |
| PATCH | `/api/videos/[id]` | 更新视频 |
| DELETE | `/api/videos/[id]` | 删除视频 |
| POST | `/api/videos/generate` | 触发视频生成 |
| GET | `/api/videos/[id]/status` | 查询生成状态 |

### 脚本

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/scripts` | 脚本列表 |
| POST | `/api/scripts` | 创建脚本 |
| POST | `/api/scripts/generate` | AI 生成脚本 |

### 头像

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/avatars` | 头像列表 (公开, 支持过滤) |
| GET | `/api/avatars/[id]` | 获取单个头像 |
| PATCH | `/api/avatars/[id]` | 更新头像 (admin) |
| DELETE | `/api/avatars/[id]` | 删除头像 (admin) |

### 计费

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/billing/checkout` | 创建 Stripe Checkout Session |
| POST | `/api/billing/portal` | 创建 Stripe Customer Portal |
| POST | `/api/billing/webhook` | Stripe Webhook 接收端 |
| GET | `/api/billing/plans` | 获取所有计划 |
| GET | `/api/billing/usage` | 获取积分使用记录 |
| GET | `/api/billing/credits` | 获取积分余额 |

### 管理

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表 (admin) |
| PATCH | `/api/admin/users` | 更新用户角色/状态 (admin) |
| GET | `/api/admin/avatars` | 头像管理列表 (admin) |
| POST | `/api/admin/avatars` | 创建头像 (admin) |
| GET | `/api/admin/credits` | 积分配置 (admin) |
| PATCH | `/api/admin/credits` | 更新积分配置 (admin) |
| POST | `/api/admin/credits` | 手动调整用户积分 (admin) |
| GET | `/api/admin/settings` | 获取系统设置 (admin) |
| PATCH | `/api/admin/settings` | 更新系统设置 (admin) |
| GET | `/api/admin/analytics` | 分析数据 (admin) |
| GET | `/api/admin/api-keys` | 获取 API key (已遮蔽) |
| PATCH | `/api/admin/api-keys` | 保存 API key (加密) |
| POST | `/api/admin/api-keys` | 测试 API 连接 |
| GET | `/api/admin/voices` | 语音库管理 (admin) |
| POST | `/api/admin/seed` | 种子数据初始化 |
| POST | `/api/admin/setup` | 系统初始化设置 |

### 仪表盘

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 用户仪表盘数据 (统计、最近项目、使用图表) |

## 技术栈详情

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.2+ |
| UI | React + TypeScript | 18.3+ |
| 样式 | Tailwind CSS | 3.4+ |
| 数据库 | Supabase (PostgreSQL) | — |
| 认证 | Supabase Auth | — |
| 支付 | Stripe | — |
| 图表 | Recharts | — |
| 图标 | Lucide React | 0.400+ |
| 日期 | date-fns | 3.6+ |
| 加密 | Node.js crypto (AES-256-GCM) | — |
