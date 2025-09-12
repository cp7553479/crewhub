import { user, chat, message, document, vote, suggestion, stream } from '../db/schema';
import type { User, Chat, DBMessage, Document, Vote, Suggestion, Stream } from '../db/schema';

// 字段名常量 - 避免硬编码
export const USER_FIELDS = {
  ID: user.id.name, // "id"
  EMAIL: user.email.name, // "email"
  PASSWORD: user.password.name, // "password"
} as const;

export const CHAT_FIELDS = {
  ID: chat.id.name, // "id"
  CREATED_AT: chat.createdAt.name, // "createdAt"
  TITLE: chat.title.name, // "title"
  USER_ID: chat.userId.name, // "userId"
  VISIBILITY: chat.visibility.name, // "visibility"
  LAST_CONTEXT: chat.lastContext.name, // "lastContext"
} as const;

export const MESSAGE_FIELDS = {
  ID: message.id.name, // "id"
  CHAT_ID: message.chatId.name, // "chatId"
  ROLE: message.role.name, // "role"
  PARTS: message.parts.name, // "parts"
  ATTACHMENTS: message.attachments.name, // "attachments"
  CREATED_AT: message.createdAt.name, // "createdAt"
} as const;

export const DOCUMENT_FIELDS = {
  ID: document.id.name, // "id"
  CREATED_AT: document.createdAt.name, // "createdAt"
  TITLE: document.title.name, // "title"
  CONTENT: document.content.name, // "content"
  KIND: document.kind.name, // "kind"
  USER_ID: document.userId.name, // "userId"
} as const;

// 表名常量
export const TABLE_NAMES = {
  USER: user._.name, // "User"
  CHAT: chat._.name, // "Chat"
  MESSAGE: message._.name, // "Message_v2"
  DOCUMENT: document._.name, // "Document"
  VOTE: vote._.name, // "Vote_v2"
  SUGGESTION: suggestion._.name, // "Suggestion"
  STREAM: stream._.name, // "Stream"
} as const;

// 表对象映射
export const TABLES = {
  user,
  chat,
  message,
  document,
  vote,
  suggestion,
  stream,
} as const;

// 类型映射
export const TABLE_TYPES = {
  user: 'User' as const,
  chat: 'Chat' as const,
  message: 'DBMessage' as const,
  document: 'Document' as const,
  vote: 'Vote' as const,
  suggestion: 'Suggestion' as const,
  stream: 'Stream' as const,
} as const;

// 字段验证函数
export function isValidUserField(fieldName: string): fieldName is keyof typeof user {
  const field = user[fieldName as keyof typeof user];
  return !!(field && typeof field === 'object' && 'name' in field);
}

export function isValidChatField(fieldName: string): fieldName is keyof typeof chat {
  const field = chat[fieldName as keyof typeof chat];
  return !!(field && typeof field === 'object' && 'name' in field);
}

export function isValidMessageField(fieldName: string): fieldName is keyof typeof message {
  const field = message[fieldName as keyof typeof message];
  return !!(field && typeof field === 'object' && 'name' in field);
}

export function isValidDocumentField(fieldName: string): fieldName is keyof typeof document {
  const field = document[fieldName as keyof typeof document];
  return !!(field && typeof field === 'object' && 'name' in field);
}

// 获取表的所有字段名
export function getTableFields(table: any): Record<string, string> {
  const fields: Record<string, string> = {};
  
  Object.keys(table).forEach(key => {
    if (table[key] && typeof table[key] === 'object' && table[key].name) {
      fields[key] = table[key].name;
    }
  });
  
  return fields;
}

// 获取表的字段信息
export function getTableFieldInfo(table: any) {
  const fields: Array<{
    name: string;
    dbName: string;
    dataType: string;
    notNull: boolean;
    hasDefault: boolean;
    isPrimaryKey: boolean;
  }> = [];
  
  Object.keys(table).forEach(key => {
    const field = table[key];
    if (field && typeof field === 'object' && field.name) {
      fields.push({
        name: key,
        dbName: field.name,
        dataType: field.dataType,
        notNull: field.notNull,
        hasDefault: field.hasDefault,
        isPrimaryKey: field.isPrimaryKey,
      });
    }
  });
  
  return fields;
}

// 表关系分析
export const TABLE_RELATIONSHIPS = {
  user: {
    tableName: user._.name,
    primaryKey: user.id.name,
    foreignKeys: [] // 用户表没有外键
  },
  chat: {
    tableName: chat._.name,
    primaryKey: chat.id.name,
    foreignKeys: [chat.userId.name] // 引用用户表
  },
  message: {
    tableName: message._.name,
    primaryKey: message.id.name,
    foreignKeys: [message.chatId.name] // 引用聊天表
  },
  vote: {
    tableName: vote._.name,
    primaryKey: [vote.chatId.name, vote.messageId.name], // 复合主键
    foreignKeys: [vote.chatId.name, vote.messageId.name] // 引用聊天和消息表
  },
  document: {
    tableName: document._.name,
    primaryKey: [document.id.name, document.createdAt.name], // 复合主键
    foreignKeys: [document.userId.name] // 引用用户表
  },
  suggestion: {
    tableName: suggestion._.name,
    primaryKey: suggestion.id.name,
    foreignKeys: [suggestion.documentId.name, suggestion.userId.name] // 引用文档和用户表
  },
  stream: {
    tableName: stream._.name,
    primaryKey: stream.id.name,
    foreignKeys: [stream.chatId.name] // 引用聊天表
  }
} as const;

// 动态查询构建器
export class DynamicQueryBuilder {
  constructor(private db: any) {}

  // 根据表名和条件构建查询
  buildSelectQuery(table: any, conditions: Record<string, any> = {}) {
    let query = this.db.select().from(table);
    
    Object.entries(conditions).forEach(([fieldName, value]) => {
      if (value !== undefined && value !== null) {
        const field = table[fieldName];
        if (field) {
          const { eq } = require('drizzle-orm');
          query = query.where(eq(field, value));
        }
      }
    });
    
    return query;
  }

  // 构建插入查询
  buildInsertQuery(table: any, data: Record<string, any>) {
    const validData: Record<string, any> = {};
    
    Object.entries(data).forEach(([fieldName, value]) => {
      const field = table[fieldName];
      if (field && value !== undefined) {
        validData[fieldName] = value;
      }
    });
    
    return this.db.insert(table).values(validData);
  }

  // 构建更新查询
  buildUpdateQuery(table: any, conditions: Record<string, any>, updates: Record<string, any>) {
    const validUpdates: Record<string, any> = {};
    
    Object.entries(updates).forEach(([fieldName, value]) => {
      const field = table[fieldName];
      if (field && value !== undefined) {
        validUpdates[fieldName] = value;
      }
    });

    let query = this.db.update(table).set(validUpdates);
    
    Object.entries(conditions).forEach(([fieldName, value]) => {
      if (value !== undefined && value !== null) {
        const field = table[fieldName];
        if (field) {
          const { eq } = require('drizzle-orm');
          query = query.where(eq(field, value));
        }
      }
    });
    
    return query;
  }
}

// 使用示例函数
export function createExampleUsage() {
  console.log('=== 表名信息 ===');
  Object.entries(TABLE_NAMES).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n=== 用户表字段 ===');
  Object.entries(USER_FIELDS).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n=== 聊天表字段 ===');
  Object.entries(CHAT_FIELDS).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log('\n=== 用户表字段信息 ===');
  const userFieldInfo = getTableFieldInfo(user);
  userFieldInfo.forEach(field => {
    console.log(`${field.name} (${field.dbName}): ${field.dataType}, notNull: ${field.notNull}, hasDefault: ${field.hasDefault}, isPrimaryKey: ${field.isPrimaryKey}`);
  });

  console.log('\n=== 表关系 ===');
  Object.entries(TABLE_RELATIONSHIPS).forEach(([tableName, info]) => {
    console.log(`${tableName}:`);
    console.log(`  表名: ${info.tableName}`);
    console.log(`  主键: ${Array.isArray(info.primaryKey) ? info.primaryKey.join(', ') : info.primaryKey}`);
    console.log(`  外键: ${info.foreignKeys.join(', ') || '无'}`);
  });
}

// 导出所有表信息
export const SCHEMA_INFO = {
  tables: TABLES,
  tableNames: TABLE_NAMES,
  tableTypes: TABLE_TYPES,
  relationships: TABLE_RELATIONSHIPS,
  fields: {
    user: USER_FIELDS,
    chat: CHAT_FIELDS,
    message: MESSAGE_FIELDS,
    document: DOCUMENT_FIELDS,
  },
  validators: {
    isValidUserField,
    isValidChatField,
    isValidMessageField,
    isValidDocumentField,
  },
  utilities: {
    getTableFields,
    getTableFieldInfo,
    DynamicQueryBuilder,
  }
} as const;
