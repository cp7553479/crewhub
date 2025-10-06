<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

This template uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to access multiple AI models through a unified interface. The default configuration includes [xAI](https://x.ai) models (`grok-2-vision-1212`, `grok-3-mini`) routed through the gateway.

### AI Gateway Authentication

**For Vercel deployments**: Authentication is handled automatically via OIDC tokens.

**For non-Vercel deployments**: You need to provide an AI Gateway API key by setting the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

With the [AI SDK](https://ai-sdk.dev/docs/introduction), you can also switch to direct LLM providers like [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://ai-sdk.dev/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of this app to your preferred platform.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).

## 项目文件结构

本项目采用 Next.js App Router 架构，以下是主要的目录结构和说明：

```
crewhub/
├── app/                          # Next.js App Router 应用目录
│   ├── (auth)/                   # 认证相关页面组
│   │   ├── actions.ts            # 认证服务器操作
│   │   ├── auth.config.ts        # Auth.js 配置
│   │   ├── auth.ts               # 认证设置
│   │   ├── login/                # 登录页面
│   │   └── register/             # 注册页面
│   ├── (chat)/                   # 聊天相关页面组
│   │   ├── actions.ts            # 聊天服务器操作
│   │   ├── api/                  # API 路由
│   │   ├── chat/                 # 聊天页面
│   │   ├── layout.tsx            # 聊天布局
│   │   └── page.tsx              # 聊天主页
│   ├── globals.css               # 全局样式
│   └── layout.tsx                # 根布局
├── artifacts/                    # 工件/文档生成功能
│   ├── actions.ts                # 工件操作
│   ├── code/                     # 代码工件
│   ├── image/                    # 图像工件
│   ├── sheet/                    # 表格工件
│   └── text/                     # 文本工件
├── components/                   # React 组件
│   ├── elements/                 # 基础元素组件
│   ├── ui/                       # UI 组件库 (shadcn/ui)
│   ├── artifact.tsx              # 工件组件
│   ├── chat.tsx                  # 聊天组件
│   ├── message.tsx               # 消息组件
│   └── ...                       # 其他组件
├── hooks/                        # React Hooks
│   ├── use-artifact.ts           # 工件相关 Hook
│   ├── use-messages.tsx          # 消息相关 Hook
│   └── ...                       # 其他 Hooks
├── lib/                          # 核心库文件
│   ├── const/                    # 常量定义
│   │   └── schema-utils.ts       # 数据库模式工具和常量
│   ├── db/                       # 数据库相关
│   │   └── queries.ts            # 数据库查询函数
│   ├── ai/                       # AI 相关功能
│   │   ├── models.ts             # AI 模型配置
│   │   ├── prompts.ts            # 提示词模板
│   │   └── tools/                # AI 工具
│   ├── artifacts/                # 工件处理
│   ├── editor/                   # 编辑器相关
│   ├── errors.ts                 # 错误处理
│   ├── types.ts                  # TypeScript 类型定义
│   └── utils.ts                  # 工具函数
├── examples/                     # 示例代码
│   └── schema-usage-examples.ts  # Schema 使用示例
├── tests/                        # 测试文件
│   ├── e2e/                      # 端到端测试
│   ├── pages/                    # 页面测试
│   └── prompts/                  # 提示词测试

├── middleware.ts                 # Next.js 中间件
├── next.config.ts                # Next.js 配置
├── package.json                  # 项目依赖和脚本
└── tsconfig.json                 # TypeScript 配置
```

### 核心目录说明

#### `/app` - Next.js App Router
- **`(auth)/`**: 认证相关页面，包含登录、注册功能
- **`(chat)/`**: 聊天功能页面，主要的用户交互界面
- **`globals.css`**: 全局样式文件，使用 Tailwind CSS

#### `/components` - React 组件
- **`elements/`**: 基础元素组件，如消息、代码块等
- **`ui/`**: UI 组件库，基于 shadcn/ui 和 Radix UI
- **主要组件**: 聊天、消息、工件、工具栏等核心功能组件

#### `/lib` - 核心库
- **`const/`**: 常量定义，包含数据库模式工具和常量
- **`db/`**: 数据库相关文件
  - `queries.ts`: 数据库查询函数集合
- **`ai/`**: AI 功能相关
  - `models.ts`: AI 模型配置
  - `prompts.ts`: 提示词模板
  - `tools/`: AI 工具定义

#### `/artifacts` - 工件系统
支持多种类型的工件生成和管理：
- **代码工件**: 代码生成和编辑
- **图像工件**: 图像处理和编辑
- **表格工件**: 数据表格处理
- **文本工件**: 文档生成和编辑

### 数据库管理

项目使用 Supabase 管理 PostgreSQL 数据库：

- **Schema**: 所有数据表存储在 `chat` schema 下
- **查询函数**: `lib/db/queries.ts` 包含所有数据库操作
- **常量工具**: `lib/const/schema-utils.ts` 提供类型安全的字段和表名常量
- **数据库管理**: 使用 Supabase Dashboard 进行数据库管理和迁移

