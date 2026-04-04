# API 配置指南

本文档说明如何配置 MakeUGC Clone 所需的各项 API 服务。

## 目录

- [环境变量配置](#环境变量配置)
- [管理后台配置](#管理后台配置)
- [脚本 AI (Script Generation)](#脚本-ai)
- [语音合成 (TTS)](#语音合成-tts)
- [口型同步 (Lip-Sync)](#口型同步-lip-sync)
- [存储 (Storage)](#存储-storage)
- [支付 (Payment)](#支付-payment)
- [加密与安全](#加密与安全)

## 环境变量配置

复制 `.env.local.example` 为 `.env.local`，填入以下配置：

```env
# ========== 必填 ==========

# Supabase (从 https://supabase.com 项目 Settings > API 获取)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 加密密钥 (用于数据库中 API key 加密存储)
# 生成命令: openssl rand -hex 32
ENCRYPTION_SECRET=your_64_char_hex_string

# 应用地址
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ========== 可选 (也可在管理后台配置) ==========

# Stripe 支付
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI APIs (优先级: 管理后台设置 > 环境变量)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=xi-...
```

> **重要**: `ENCRYPTION_SECRET` 一旦设置后不能更改，否则已加密的 API key 将无法解密。

## 管理后台配置

登录管理后台 `/admin/settings` 后，可以通过 6 个标签页配置所有 API：

### 脚本 AI

用于 AI 脚本自动生成功能。

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Script Provider | 选择 AI 提供商 | `openai` / `anthropic` |
| OpenAI API Key | 从 platform.openai.com 获取 | `sk-proj-...` |
| OpenAI Model | 脚本生成使用的模型 | `gpt-4o` / `gpt-4o-mini` / `gpt-4-turbo` |
| Anthropic API Key | 从 console.anthropic.com 获取 | `sk-ant-...` |
| Anthropic Model | 脚本生成使用的模型 | `claude-sonnet-4-20250514` |

**获取 OpenAI API Key:**
1. 访问 https://platform.openai.com/api-keys
2. 点击 "Create new secret key"
3. 复制 key 粘贴到管理后台

**获取 Anthropic API Key:**
1. 访问 https://console.anthropic.com/settings/keys
2. 点击 "Create Key"
3. 复制 key 粘贴到管理后台

### 语音合成 (TTS)

用于将脚本文字转换为语音配音。

| 配置项 | 说明 | 示例 |
|--------|------|------|
| TTS Provider | 选择 TTS 提供商 | `elevenlabs` / `fish_audio` / `mock` |
| ElevenLabs API Key | 从 elevenlabs.io 获取 | `xi-...` |
| Default Voice ID | ElevenLabs 默认语音 | `21m00Tcm4TlvDq8ikWAM` |
| Fish Audio API Key | 从 fish.audio 获取 | `fa-...` |

**获取 ElevenLabs API Key:**
1. 访问 https://elevenlabs.io/app/settings/api-keys
2. 确保 key 有 `/v1/user` 和 `/v1/text-to-speech` 权限
3. 复制 key 粘贴到管理后台

**常见问题:**
- 测试连接显示 `401 missing_permissions`：API key 权限不足，需要在 ElevenLabs 后台检查权限
- 测试连接显示 `Network error`：服务器无法访问 ElevenLabs API，可能需要配置代理

### 口型同步 (Lip-Sync)

用于将 TTS 语音与 AI 头像同步生成视频。

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Lipsync Provider | 选择口型同步引擎 | `heygen` / `simli` / `mock` |
| HeyGen API Key | 从 heygen.com 获取 | HeyGen API token |
| Simli API Key | 从 simli.com 获取 | Simli API token |

### 存储 (Storage)

用于存储生成的视频、音频和缩略图。

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Storage Provider | 选择存储后端 | `supabase` / `s3` |
| AWS Access Key ID | AWS IAM access key | `AKIA...` |
| AWS Secret Access Key | AWS IAM secret | `wJalr...` |
| S3 Bucket | S3 存储桶名 | `my-ugc-videos` |
| S3 Region | AWS 区域 | `us-east-1` |

### 支付 (Payment)

用于订阅计划和积分购买。

| 配置项 | 说明 | 示例 |
|--------|------|------|
| Stripe Secret Key | Stripe 私钥 | `sk_test_...` / `sk_live_...` |
| Stripe Publishable Key | Stripe 公钥 | `pk_test_...` / `pk_live_...` |
| Stripe Webhook Secret | Webhook 签名密钥 | `whsec_...` |

**配置 Stripe Webhook:**

本地开发:
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

生产环境:
1. 在 Stripe Dashboard > Developers > Webhooks 添加端点
2. URL: `https://yourdomain.com/api/billing/webhook`
3. 监听事件: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

## 加密与安全

所有敏感 API key 在存储到数据库前都会通过 AES-256-GCM 加密：

- **加密算法**: AES-256-GCM (认证加密)
- **密钥派生**: ENCRYPTION_SECRET 经 SHA-256 哈希为 32 字节密钥
- **随机 IV**: 每次加密使用独立的 16 字节随机 IV
- **存储格式**: `base64(IV + AuthTag + Ciphertext)`
- **管理后台显示**: 仅显示前 4 位 + 后 4 位，中间以 `••••` 遮蔽

**被加密的 key:**
`openai`, `anthropic`, `elevenlabs`, `fish_audio`, `heygen`, `simli`, `aws_access`, `aws_secret`, `stripe_secret`, `stripe_publishable`, `stripe_webhook`

**非加密的配置项 (明文存储):**
模型选择、provider 选择、voice ID、S3 bucket/region 等非敏感配置
