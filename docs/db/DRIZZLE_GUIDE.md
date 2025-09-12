# Drizzle 数据库管理指南

## 概述

你的项目使用 Drizzle ORM 来管理 PostgreSQL 数据库。Drizzle 是一个轻量级、类型安全的 TypeScript ORM，提供了出色的开发体验。

## 项目结构

```
lib/db/
├── schema.ts          # 数据库模式定义
├── queries.ts         # 数据库查询函数
├── migrate.ts         # 迁移脚本
├── utils.ts           # 数据库工具函数
├── migrations/        # 迁移文件目录
│   ├── 0000_*.sql
│   ├── 0001_*.sql
│   └── meta/          # 迁移元数据
└── helpers/           # 辅助工具
```

## 核心配置

### 1. Drizzle 配置 (`drizzle.config.ts`)

```typescript
export default defineConfig({
  schema: './lib/db/schema.ts',        // 模式文件路径
  out: './lib/db/migrations',          // 迁移文件输出目录
  dialect: 'postgresql',               // 数据库类型
  dbCredentials: {
    url: process.env.POSTGRES_URL!,    // 数据库连接URL
  },
});
```

### 2. 环境变量设置

确保你的 `.env.local` 文件包含：

```env
POSTGRES_URL=postgresql://username:password@localhost:5432/database_name
```

## 数据库模式管理

### 当前模式结构

你的项目包含以下主要表：

- **User** - 用户信息
- **Chat** - 聊天会话
- **Message** - 消息记录 (v2版本)
- **MessageDeprecated** - 已弃用的消息表
- **Vote** - 消息投票 (v2版本)
- **VoteDeprecated** - 已弃用的投票表
- **Document** - 文档/工件
- **Suggestion** - 建议记录
- **Stream** - 流处理记录

### 定义新表

在 `lib/db/schema.ts` 中添加新表：

```typescript
import { pgTable, varchar, timestamp, uuid, text } from 'drizzle-orm/pg-core';

export const newTable = pgTable('NewTable', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  description: text('description'),
});

export type NewTable = InferSelectModel<typeof newTable>;
```

## 迁移管理

### 可用的迁移命令

```bash
# 生成迁移文件（基于schema.ts的更改）
pnpm run db:generate

# 运行迁移
pnpm run db:migrate

# 推送模式到数据库（跳过迁移）
pnpm run db:push

# 从数据库拉取模式
pnpm run db:pull

# 检查迁移状态
pnpm run db:check

# 打开Drizzle Studio（可视化数据库管理）
pnpm run db:studio

# 升级迁移
pnpm run db:up
```

### 迁移工作流程

1. **修改模式** - 编辑 `lib/db/schema.ts`
2. **生成迁移** - 运行 `pnpm run db:generate`
3. **检查迁移** - 查看生成的SQL文件
4. **应用迁移** - 运行 `pnpm run db:migrate`

### 示例：添加新字段

```typescript
// 在 schema.ts 中修改表定义
export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  // 添加新字段
  displayName: varchar('displayName', { length: 100 }),
  avatarUrl: text('avatarUrl'),
});
```

然后运行：
```bash
pnpm run db:generate
pnpm run db:migrate
```

## 数据库查询操作

### 查询函数位置

所有数据库查询函数都在 `lib/db/queries.ts` 中定义。

### 常用查询模式

#### 1. 用户操作

```typescript
// 获取用户
const users = await getUser('user@example.com');

// 创建用户
await createUser('user@example.com', 'password123');

// 创建访客用户
const guestUser = await createGuestUser();
```

#### 2. 聊天操作

```typescript
// 保存聊天
await saveChat({
  id: 'chat-id',
  userId: 'user-id',
  title: 'Chat Title',
  visibility: 'private'
});

// 获取用户聊天列表
const { chats, hasMore } = await getChatsByUserId({
  id: 'user-id',
  limit: 10,
  startingAfter: null,
  endingBefore: null
});

// 删除聊天
await deleteChatById({ id: 'chat-id' });
```

#### 3. 消息操作

```typescript
// 保存消息
await saveMessages({
  messages: [{
    id: 'message-id',
    chatId: 'chat-id',
    role: 'user',
    parts: [{ type: 'text', text: 'Hello!' }],
    attachments: [],
    createdAt: new Date()
  }]
});

// 获取聊天消息
const messages = await getMessagesByChatId({ id: 'chat-id' });
```

#### 4. 文档操作

```typescript
// 保存文档
await saveDocument({
  id: 'doc-id',
  title: 'Document Title',
  kind: 'text',
  content: 'Document content',
  userId: 'user-id'
});

// 获取文档
const document = await getDocumentById({ id: 'doc-id' });
```

### 复杂查询示例

```typescript
// 获取用户消息统计
const messageCount = await getMessageCountByUserId({
  id: 'user-id',
  differenceInHours: 24
});

// 投票消息
await voteMessage({
  chatId: 'chat-id',
  messageId: 'message-id',
  type: 'up'
});
```

## 最佳实践

### 1. 类型安全

```typescript
// 使用 InferSelectModel 获取类型
export type User = InferSelectModel<typeof user>;
export type Chat = InferSelectModel<typeof chat>;

// 在函数中使用类型
export async function getUser(email: string): Promise<Array<User>> {
  return await db.select().from(user).where(eq(user.email, email));
}
```

### 2. 错误处理

```typescript
try {
  const result = await db.select().from(user).where(eq(user.email, email));
  return result;
} catch (error) {
  throw new ChatSDKError(
    'bad_request:database',
    'Failed to get user by email'
  );
}
```

### 3. 连接管理

```typescript
// 使用单例连接
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);
```

### 4. 迁移安全

- 始终在生产环境前测试迁移
- 备份重要数据
- 使用 `db:check` 验证迁移状态
- 考虑使用 `db:push` 进行快速原型开发

## 调试和监控

### 1. Drizzle Studio

```bash
pnpm run db:studio
```

这会在浏览器中打开一个可视化界面，让你：
- 查看表结构
- 浏览数据
- 执行查询
- 监控数据库状态

### 2. 日志和错误处理

```typescript
// 在 queries.ts 中使用统一的错误处理
export class ChatSDKError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ChatSDKError';
  }
}
```

### 3. 性能监控

```typescript
// 添加查询时间监控
const start = Date.now();
const result = await db.select().from(user);
const end = Date.now();
console.log(`Query took ${end - start}ms`);
```

## 常见问题解决

### 1. 迁移失败

```bash
# 检查迁移状态
pnpm run db:check

# 重置迁移（谨慎使用）
# 删除 migrations 文件夹中的迁移文件
# 重新生成迁移
```

### 2. 连接问题

- 检查 `POSTGRES_URL` 环境变量
- 确保数据库服务运行
- 验证网络连接

### 3. 类型错误

- 确保模式定义正确
- 重新生成类型定义
- 检查导入语句

## 下一步

1. 熟悉现有的查询函数
2. 根据需要添加新的查询函数
3. 使用 Drizzle Studio 探索数据
4. 根据需要修改数据库模式
5. 遵循最佳实践进行开发

这个指南应该能帮助你有效地使用 Drizzle 管理你的数据库。如果有具体问题，可以参考现有的代码实现或查看 Drizzle 官方文档。
