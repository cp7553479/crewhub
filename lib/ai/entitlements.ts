import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const userEntitlements: Entitlements = {
  maxMessagesPerDay: 100,
  availableChatModelIds: ['chat-model', 'chat-model-reasoning', 'base-assistant'],
};
