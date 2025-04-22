import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  experimental_createMCPClient,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
//import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
  getActiveMCPsByUserId,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
// import { createDocument } from '@/lib/ai/tools/create-document';
// import { updateDocument } from '@/lib/ai/tools/update-document';
// import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    // Obtener los MCPs activos del usuario desde la base de datos
    const activeMcps = await getActiveMCPsByUserId({ userId: session.user.id });

    // Objeto para almacenar todas las herramientas de los MCPs
    let allMcpTools: Record<string, any> = {};

    // Si hay MCPs activos, obtener sus herramientas
    if (activeMcps.length > 0) {
      try {
        // Crear clientes MCP para cada MCP activo y obtener sus herramientas
        for (const userMcp of activeMcps) {
          try {
            // Solo procesar MCPs con URL válida
            if (!userMcp.url) continue;

            // Crear cliente MCP para cada MCP activo
            const mcpClient = await experimental_createMCPClient({
              transport: {
                type: (userMcp.type as any) || 'sse',
                url: userMcp.url,
              },
            });

            // Obtener herramientas del MCP
            const mcpTools = await mcpClient.tools();
            console.log(`MCP ${userMcp.name} tools:`, Object.keys(mcpTools));

            // Combinar con las herramientas ya obtenidas
            allMcpTools = { ...allMcpTools, ...mcpTools };
          } catch (mcpError) {
            console.error(`Error connecting to MCP ${userMcp.name}:`, mcpError);
            // Continuamos con el siguiente MCP si hay error en este
          }
        }
      } catch (mcpsError) {
        console.error('Error processing MCPs:', mcpsError);
        // Continuamos con las herramientas locales si hay error con los MCPs
      }
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        const localTools = {
          getWeather,
          // createDocument: createDocument({ session, dataStream }),
          // updateDocument: updateDocument({ session, dataStream }),
          // requestSuggestions: requestSuggestions({ session, dataStream }),
        };

        // Combinar herramientas locales con las de los MCPs
        const tools = {
          ...localTools,
          ...allMcpTools,
        };

        const prompt = `
        Eres un asistente amigable! Mantén tus respuestas concisas y útiles.
        `;

        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          // system: systemPrompt({ selectedChatModel }),
          system: prompt,
          messages,
          maxSteps: 5,
          // experimental_activeTools:
          //   selectedChatModel === 'chat-model-reasoning'
          //     ? []
          //     : [
          //         'getWeather',
          //         'createDocument',
          //         'updateDocument',
          //         'requestSuggestions',
          //       ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools,
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    console.error('Error in POST route:', error);
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
