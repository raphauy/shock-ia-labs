export const DEFAULT_CHAT_MODEL: string = 'chat-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model (GPT-4.1)',
    description: 'Modelo principal para chats de propósito general',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model (o4-mini)',
    description: 'Usa razonamiento avanzado',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Modelo GPT-4.1 Mini de OpenAI',
  },
];
