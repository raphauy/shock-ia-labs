import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user as userSchema,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  mcp,
  type MCP,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { users as authUser } from './auth-schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    // Intentar primero obtener de la tabla Auth.js
    const authUsers = await db
      .select()
      .from(authUser)
      .where(eq(authUser.email, email));

    if (authUsers && authUsers.length > 0) {
      // Convertir el formato de Auth.js a nuestro formato
      return authUsers.map((au) => ({
        id: au.id,
        email: au.email,
        password: null,
      })) as unknown as User[];
    }

    // Si no encontramos en la tabla de Auth.js, buscar en la antigua tabla
    return await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, email));
  } catch (error) {
    console.error('Failed to get user from database', error);
    throw error;
  }
}

export async function createUser(email: string, password?: string) {
  try {
    // Verificar si el usuario ya existe en alguna de las dos tablas
    const existingAuthUsers = await db
      .select()
      .from(authUser)
      .where(eq(authUser.email, email));
    if (existingAuthUsers && existingAuthUsers.length > 0) {
      console.log('Usuario ya existe en la tabla auth user');
      return { id: existingAuthUsers[0].id };
    }

    const existingUsers = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, email));
    if (existingUsers && existingUsers.length > 0) {
      console.log('Usuario ya existe en la tabla user');
      return { id: existingUsers[0].id };
    }

    // El disparador se encargará de sincronizar con la tabla User
    if (password) {
      const salt = genSaltSync(10);
      const hash = hashSync(password, salt);
      // Generar un ID en formato de texto para Auth.js
      const userId = crypto.randomUUID();

      await db.insert(authUser).values({
        id: userId,
        email: email,
        name: null,
        emailVerified: null,
        image: null,
      });

      return { id: userId };
    } else {
      // Para magic link, no necesitamos contraseña
      const userId = crypto.randomUUID();

      await db.insert(authUser).values({
        id: userId,
        email: email,
        name: null,
        emailVerified: null,
        image: null,
      });

      return { id: userId };
    }
  } catch (error) {
    console.error('Failed to create user in database', error);
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
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
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

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
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

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
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
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
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
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
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

// MCP CRUD Operations

export async function createMCP({
  name,
  type,
  url,
  isActive,
  userId,
  description,
  capabilities,
  tools,
}: {
  name: string;
  type: 'sse' | 'stdio' | 'http';
  url: string;
  isActive: boolean;
  userId: string;
  description?: string;
  capabilities?: {
    resources?: boolean;
    tools?: boolean;
    prompts?: boolean;
    sampling?: boolean;
  };
  tools?: any;
}) {
  try {
    const [newMCP] = await db
      .insert(mcp)
      .values({
        name,
        type,
        url,
        isActive,
        userId,
        description,
        capabilities,
        tools,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newMCP;
  } catch (error) {
    console.error('Failed to create MCP in database', error);
    throw error;
  }
}

export async function getMCPsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(mcp)
      .where(eq(mcp.userId, userId))
      .orderBy(asc(mcp.name));
  } catch (error) {
    console.error('Failed to get MCPs by user ID from database', error);
    throw error;
  }
}

export async function getActiveMCPsByUserId({ userId }: { userId: string }) {
  try {
    return await db
      .select()
      .from(mcp)
      .where(and(eq(mcp.userId, userId), eq(mcp.isActive, true)))
      .orderBy(asc(mcp.name));
  } catch (error) {
    console.error('Failed to get active MCPs by user ID from database', error);
    throw error;
  }
}

export async function getMCPById({ id }: { id: string }) {
  try {
    const [selectedMCP] = await db.select().from(mcp).where(eq(mcp.id, id));

    return selectedMCP;
  } catch (error) {
    console.error('Failed to get MCP by ID from database', error);
    throw error;
  }
}

export async function updateMCP({
  id,
  name,
  type,
  url,
  isActive,
  description,
  capabilities,
  tools,
}: {
  id: string;
  name?: string;
  type?: 'sse' | 'stdio' | 'http';
  url?: string;
  isActive?: boolean;
  description?: string;
  capabilities?: {
    resources?: boolean;
    tools?: boolean;
    prompts?: boolean;
    sampling?: boolean;
  };
  tools?: any;
}) {
  try {
    const updateValues: Partial<MCP> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateValues.name = name;
    if (type !== undefined) updateValues.type = type;
    if (url !== undefined) updateValues.url = url;
    if (isActive !== undefined) updateValues.isActive = isActive;
    if (description !== undefined) updateValues.description = description;
    if (capabilities !== undefined) updateValues.capabilities = capabilities;
    if (tools !== undefined) updateValues.tools = tools;

    const [updatedMCP] = await db
      .update(mcp)
      .set(updateValues)
      .where(eq(mcp.id, id))
      .returning();

    return updatedMCP;
  } catch (error) {
    console.error('Failed to update MCP in database', error);
    throw error;
  }
}

export async function deleteMCPById({ id }: { id: string }) {
  try {
    const [deletedMCP] = await db.delete(mcp).where(eq(mcp.id, id)).returning();

    return deletedMCP;
  } catch (error) {
    console.error('Failed to delete MCP from database', error);
    throw error;
  }
}

export async function toggleMCPActive({ id }: { id: string }) {
  try {
    // Primero obtenemos el MCP para conocer su estado actual
    const [currentMCP] = await db.select().from(mcp).where(eq(mcp.id, id));

    if (!currentMCP) {
      throw new Error(`MCP with id ${id} not found`);
    }

    // Luego invertimos el estado actual
    const [updatedMCP] = await db
      .update(mcp)
      .set({
        isActive: !currentMCP.isActive,
        updatedAt: new Date(),
      })
      .where(eq(mcp.id, id))
      .returning();

    return updatedMCP;
  } catch (error) {
    console.error('Failed to toggle MCP active state in database', error);
    throw error;
  }
}

/**
 * Obtiene todas las tools de los MCPs activos de un usuario
 */
export async function getAllUserTools({ userId }: { userId: string }) {
  try {
    // Obtener todos los MCPs activos del usuario
    const mcps = await db
      .select()
      .from(mcp)
      .where(and(eq(mcp.userId, userId), eq(mcp.isActive, true)));

    // Si no hay MCPs, devolver un array vacío
    if (!mcps || mcps.length === 0) {
      return {
        totalTools: 0,
        tools: [],
      };
    }

    // Acumular todas las tools de los MCPs
    let allTools: Array<{ name: string; mcpName: string }> = [];

    mcps.forEach((mcpItem) => {
      if (mcpItem.tools) {
        const toolsObj = mcpItem.tools as Record<string, any>;
        const mcpTools = Object.keys(toolsObj).map((key) => ({
          name: toolsObj[key]?.name || key,
          mcpName: mcpItem.name,
        }));
        allTools = [...allTools, ...mcpTools];
      }
    });

    return {
      totalTools: allTools.length,
      tools: allTools,
    };
  } catch (error) {
    console.error('Error al obtener todas las tools del usuario:', error);
    throw error;
  }
}
