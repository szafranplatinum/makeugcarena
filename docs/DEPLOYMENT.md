# 部署指南

## 本地开发

### 前置要求

- Node.js 18+
- npm 9+
- Supabase 项目 (免费版即可)
- Stripe 账号 (测试模式)

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/make-ugc-clone.git
cd make-ugc-clone

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入你的配置

# 4. 初始化数据库
# 在 Supabase Dashboard > SQL Editor 中执行 supabase/schema.sql

# 5. 启动开发服务器
npm run dev
```

访问:
- 首页: http://localhost:3000
- 用户后台: http://localhost:3000/dashboard
- 管理后台: http://localhost:3000/admin

### 创建管理员

1. 通过 `/register` 注册一个普通账号
2. 在 Supabase Dashboard > Table Editor > user_profiles
3. 找到你的用户，将 `role` 字段改为 `super_admin`
4. 刷新页面，即可访问管理后台

### 种子数据

登录管理员后访问 `POST /api/admin/seed` 可初始化示例头像数据。

### Stripe 本地测试

```bash
# 安装 Stripe CLI
brew install stripe/stripe-cli/stripe

# 登录
stripe login

# 转发 Webhook 到本地
stripe listen --forward-to localhost:3000/api/billing/webhook

# 复制输出的 webhook secret 到 .env.local
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 生产部署 (Vercel)

### 1. 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或直接在 Vercel Dashboard 中导入 GitHub 仓库。

### 2. 配置环境变量

在 Vercel Dashboard > Settings > Environment Variables 中设置:

| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名 key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ENCRYPTION_SECRET` | API key 加密密钥 |
| `NEXT_PUBLIC_APP_URL` | 生产域名 (如 https://app.yourdomain.com) |
| `STRIPE_SECRET_KEY` | Stripe 生产 secret key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 生产 publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe 生产 webhook secret |

### 3. 配置 Stripe Webhook

1. Stripe Dashboard > Developers > Webhooks
2. 添加端点: `https://app.yourdomain.com/api/billing/webhook`
3. 选择事件:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 4. 配置 Supabase

确保 Supabase 项目:
- Authentication > URL Configuration > Site URL 设置为生产域名
- Authentication > URL Configuration > Redirect URLs 添加生产域名回调地址

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # ESLint 检查
```
