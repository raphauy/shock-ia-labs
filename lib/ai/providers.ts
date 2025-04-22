import { openai } from '@ai-sdk/openai';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'gpt-4.1-mini': chatModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai('gpt-4.1'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('o4-mini'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4.1'),
        'artifact-model': openai('gpt-4.1'),
        'gpt-4.1-mini': openai('gpt-4.1-mini'),
      },
      imageModels: {
        'small-model': openai.image('gpt-4.1'),
      },
    });
