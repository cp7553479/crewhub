import 'server-only';

import { createClient } from '@/utils/supabase/server';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import type { LanguageModelV2Usage } from '@ai-sdk/provider';

// Define types for compatibility
export interface User {
  id: string;
  email: string;
  password?: string;
}

export interface Chat {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
}

export interface Message {
  id: string;
  chatId: string;
  role: string;
  content: any;
  createdAt: Date;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface Document {
  id: string;
  createdAt: Date;
  title: string;
  content: string | null;
  kind: ArtifactKind;
  userId: string;
  [key: string]: unknown;
}

export interface Suggestion {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
}

interface DBMessage {
  id: string;
  chatId: string;
  role: string;
  content: any;
  createdAt: Date;
}

// 用户相关操作
export async function getUser(email: string): Promise<Array<User>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"User"')
      .select('*')
      .eq('email', email);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"User"')
      .insert({ email, password: hashedPassword });
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}



// 聊天相关操作
export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Chat"')
      .insert({
        id,
        createdAt: new Date().toISOString(),
        userId,
        title,
        visibility,
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    
    // 删除相关的投票
    await supabase.schema('chat').from('"Vote"').delete().eq('"chatId"', id);
    
    // 删除相关的消息
    await supabase.schema('chat').from('"Message"').delete().eq('"chatId"', id);
    
    // 删除相关的流
    await supabase.schema('chat').from('"Stream"').delete().eq('"chatId"', id);

    // 删除聊天记录
    const { data, error } = await supabase
      .schema('chat').from('"Chat"')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const supabase = await createClient();
    const extendedLimit = limit + 1;

    let query = supabase
      .schema('chat').from('"Chat"')
      .select('*')
      .eq('"userId"', id)
      .order('"createdAt"', { ascending: false })
      .limit(extendedLimit);

    if (startingAfter) {
      const { data: selectedChat, error: chatError } = await supabase
        .schema('chat').from('"Chat"')
        .select('"createdAt"')
        .eq('id', startingAfter)
        .single();

      if (chatError || !selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      query = query.gt('"createdAt"', selectedChat.createdAt);
    } else if (endingBefore) {
      const { data: selectedChat, error: chatError } = await supabase
        .schema('chat').from('"Chat"')
        .select('"createdAt"')
        .eq('id', endingBefore)
        .single();

      if (chatError || !selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      query = query.lt('"createdAt"', selectedChat.createdAt);
    }

    const { data: filteredChats, error } = await query;
    
    if (error) throw error;

    const hasMore = (filteredChats?.length || 0) > limit;

    return {
      chats: hasMore ? filteredChats?.slice(0, limit) || [] : filteredChats || [],
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Chat"')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

// 消息相关操作
export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Message"')
      .insert(messages);
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Message"')
      .select('*')
      .eq('"chatId"', id)
      .order('"createdAt"', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Message"')
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const supabase = await createClient();
    
    // 首先获取要删除的消息ID
    const { data: messagesToDelete, error: selectError } = await supabase
      .schema('chat').from('"Message"')
      .select('id')
      .eq('"chatId"', chatId)
      .gte('"createdAt"', timestamp.toISOString());
    
    if (selectError) throw selectError;
    
    const messageIds = messagesToDelete?.map((message) => message.id) || [];

    if (messageIds.length > 0) {
      // 删除相关投票
      await supabase
        .schema('chat').from('"Vote"')
        .delete()
        .eq('"chatId"', chatId)
        .in('"messageId"', messageIds);

      // 删除消息
      const { data, error } = await supabase
        .schema('chat').from('"Message"')
        .delete()
        .eq('"chatId"', chatId)
        .in('id', messageIds);
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

// 投票相关操作
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const supabase = await createClient();
    
    // 检查是否已存在投票
    const { data: existingVote, error: selectError } = await supabase
      .schema('chat').from('"Vote"')
      .select('*')
      .eq('"messageId"', messageId)
      .single();

    if (existingVote) {
      // 更新现有投票
      const { data, error } = await supabase
        .schema('chat').from('"Vote"')
        .update({ isUpvoted: type === 'up' })
        .eq('"messageId"', messageId)
        .eq('"chatId"', chatId);
      
      if (error) throw error;
      return data;
    } else {
      // 创建新投票
      const { data, error } = await supabase
        .schema('chat').from('"Vote"')
        .insert({
          chatId,
          messageId,
          isUpvoted: type === 'up',
        });
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Vote"')
      .select('*')
      .eq('"chatId"', id);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

// 文档相关操作
export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Document"')
      .insert({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date().toISOString(),
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsByUserId({ userId }: { userId: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Document"')
      .select('*')
      .eq('"userId"', userId)
      .order('"createdAt"', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by user id',
    );
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Document"')
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Document"')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    const supabase = await createClient();
    
    // 删除相关建议
    await supabase
      .schema('chat').from('"Suggestion"')
      .delete()
      .eq('"documentId"', id)
      .gt('"documentCreatedAt"', timestamp.toISOString());

    // 删除文档
    const { data, error } = await supabase
      .schema('chat').from('"Document"')
      .delete()
      .eq('id', id)
      .gt('"createdAt"', timestamp.toISOString())
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

// 建议相关操作
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Suggestion"')
      .insert(suggestions);
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Suggestion"')
      .select('*')
      .eq('"documentId"', documentId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

// 聊天更新操作
export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Chat"')
      .update({ visibility })
      .eq('id', chatId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  context: LanguageModelV2Usage;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Chat"')
      .update({ lastContext: context })
      .eq('id', chatId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Failed to update lastContext for chat', chatId, error);
    return;
  }
}

// 统计相关操作
export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const supabase = await createClient();
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .schema('chat').from('"Message"')
      .select('id, "Chat"!inner("userId")', { count: 'exact' })
      .eq('"Chat"."userId"', id)
      .gte('"createdAt"', twentyFourHoursAgo)
      .eq('"role"', 'user');
    
    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

// 流相关操作
export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Stream"')
      .insert({ 
        id: streamId, 
        chatId, 
        createdAt: new Date().toISOString() 
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('chat').from('"Stream"')
      .select('id')
      .eq('"chatId"', chatId)
      .order('"createdAt"', { ascending: true });
    
    if (error) throw error;
    return data?.map(({ id }) => id) || [];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}