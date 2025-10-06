// Schema utilities for code completion and type definitions
// NOTE: This file is kept for development purposes only
// Actual database operations are handled by Supabase SDK

// Type definitions for database schema
export type InferSelectModel<T> = T;

// Common field definitions
// Common field patterns for reference
export const commonFields = {
  id: 'uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL',
  createdAt: 'timestamp NOT NULL',
  updatedAt: 'timestamp NOT NULL',
};

// Utility functions for schema operations (for development reference)
export const schemaUtils = {
  // User operations
  getUserByEmail: (email: string) => {
    // Reference implementation - actual queries use Supabase
    console.log('Getting user by email:', email);
  },
  
  // Chat operations
  getChatById: (id: string) => {
    console.log('Getting chat by id:', id);
  },
  
  // Message operations
  getMessagesByChatId: (chatId: string) => {
    console.log('Getting messages by chat id:', chatId);
  },
  
  // Vote operations
  voteMessage: (messageId: string, isUpvoted: boolean) => {
    console.log('Voting on message:', messageId, isUpvoted);
  },
  
  // Document operations
  getDocumentById: (id: string) => {
    console.log('Getting document by id:', id);
  },
  
  // Suggestion operations
  getSuggestionsByDocumentId: (documentId: string) => {
    console.log('Getting suggestions by document id:', documentId);
  },
};

// Type definitions for reference
export interface DatabaseSchema {
  User: {
    id: string;
    email: string;
    password?: string;
  };
  
  Chat: {
    id: string;
    createdAt: Date;
    title: string;
    userId: string;
    visibility: 'public' | 'private';
  };
  
  Message: {
    id: string;
    chatId: string;
    role: string;
    content: any;
    createdAt: Date;
  };
  
  Vote: {
    chatId: string;
    messageId: string;
    isUpvoted: boolean;
  };
  
  Document: {
    id: string;
    createdAt: Date;
    title: string;
    content?: string;
    userId: string;
  };
  
  Suggestion: {
    id: string;
    documentId: string;
    documentCreatedAt: Date;
    originalText: string;
    suggestedText: string;
    description?: string;
    isResolved: boolean;
    userId: string;
    createdAt: Date;
  };
}

// Development helpers
export const devHelpers = {
  logQuery: (operation: string, params: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB Query] ${operation}:`, params);
    }
  },
  
  validateId: (id: string) => {
    return typeof id === 'string' && id.length > 0;
  },
  
  formatTimestamp: (date: Date) => {
    return date.toISOString();
  },
};

// Mock data for development
export const mockData = {
  user: {
    id: 'mock-user-id',
    email: 'test@example.com',
  },
  
  chat: {
    id: 'mock-chat-id',
    title: 'Test Chat',
    userId: 'mock-user-id',
    createdAt: new Date(),
    visibility: 'private' as const,
  },
  
  message: {
    id: 'mock-message-id',
    chatId: 'mock-chat-id',
    role: 'user',
    content: { text: 'Hello' },
    createdAt: new Date(),
  },
};

// Example query patterns for reference
const exampleQueries = {
  findUserByEmail: (email: string) => {
    return `SELECT * FROM "User" WHERE email = '${email}'`;
  },
  
  findChatById: (id: string) => {
    return `SELECT * FROM "Chat" WHERE id = '${id}'`;
  },
};

console.log('Schema utilities loaded for Supabase');

// Export for backward compatibility
export default schemaUtils;