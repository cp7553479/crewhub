import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { createOpenAI } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';

// 原有的 Provider（保持向后兼容）
export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        baseAssistantModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require('./models.mock');
      return customProvider({
        languageModels: {
          'chat-model': chatModel,
          'chat-model-reasoning': reasoningModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
          'base-assistant': baseAssistantModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        'chat-model': gateway.languageModel('mistral/ministral-3b'),
        'chat-model-reasoning': wrapLanguageModel({
          model: gateway.languageModel('mistral/ministral-3b'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': gateway.languageModel('mistral/ministral-3b'),
        'artifact-model': gateway.languageModel('mistral/ministral-3b'),
        'base-assistant': createOpenAI({
          baseURL: 'https://crewhub-py.vercel.app/v1', // 自定义 base URL
        })('base-assistant'),
      },
    });

