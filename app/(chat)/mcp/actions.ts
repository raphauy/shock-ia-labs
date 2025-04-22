'use server';

import { auth } from '@/app/(auth)/auth';
import { experimental_createMCPClient, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  createMCP,
  getMCPsByUserId,
  getMCPById,
  toggleMCPActive,
  deleteMCPById,
} from '@/lib/db/queries';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Extrae información segura para serializar de herramientas MCP
 */
function extractSafeToolInfo(tools: Record<string, any>) {
  const safeTools: Record<string, any> = {};

  Object.keys(tools).forEach((key) => {
    const tool = tools[key];
    // Solo mantener propiedades seguras para serializar
    safeTools[key] = {
      name: tool.name || key,
      description: tool.description || '',
      parameters: tool.parameters
        ? {
            properties: tool.parameters.jsonSchema?.properties || {},
          }
        : {},
    };
  });

  return safeTools;
}

/**
 * Genera nombre y descripción para un MCP utilizando AI cuando no hay información disponible
 */
async function generateMcpInfo(url: string, toolsInfo: any) {
  try {
    // Extraer información de dominio
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;

    // Extraer nombres de herramientas
    const toolNames = Object.keys(toolsInfo);

    // Generar descripciones cortas de herramientas
    const toolDescriptions = toolNames.map((name) => {
      const tool = toolsInfo[name];
      return {
        name,
        description: tool.description || 'Sin descripción disponible',
      };
    });

    // Utilizar generateObject para crear un nombre y descripción apropiados
    const { object } = await generateObject({
      model: openai('gpt-4.1'),
      schema: z.object({
        name: z
          .string()
          .describe('Un nombre descriptivo y profesional para el servidor MCP'),
        description: z
          .string()
          .describe(
            'Una descripción clara, concisa y muy breve que explique la funcionalidad del MCP',
          ),
      }),
      prompt: `Crea un nombre y descripción profesionales para un servidor MCP (Model Context Protocol) basado en la siguiente información:
      
      URL: ${url}
      Dominio: ${domain}
      Ruta: ${path}
      
      Herramientas disponibles:
      ${toolDescriptions.map((tool) => `- ${tool.name}: ${tool.description}`).join('\n')}
      
      Utiliza el dominio para crear un nombre descriptivo. Por ejemplo, si las tools tratan de Google Calendar y el dominio es de Zapier, el nombre podría ser "Google Calendar MCP (Zapier)".
      Analiza los nombres de las herramientas y la URL para entender el propósito del MCP. El nombre debe ser conciso y descriptivo, la descripción debe explicar claramente qué hace este MCP.`,
    });

    return {
      name: object.name,
      description: object.description,
      isAiGenerated: true,
    };
  } catch (error) {
    console.error('Error generando información del MCP:', error);

    // Fallback en caso de error
    return {
      name: `Servidor MCP en ${new URL(url).hostname}`,
      description: `Servidor MCP con ${Object.keys(toolsInfo).length} herramientas disponibles.`,
      isAiGenerated: true,
    };
  }
}

/**
 * Valida una URL de MCP intentando conectarse y recuperando información sobre el servidor
 */
export async function validateMcpUrl(url: string) {
  try {
    console.log('Validando MCP URL:', url);

    // Verificar que el usuario esté autenticado
    const session = await auth();
    if (!session || !session.user) {
      console.log('Usuario no autenticado');
      return {
        success: false,
        error: 'Debes iniciar sesión para usar esta función',
      };
    }

    // Intentamos instanciar el cliente MCP
    const mcpClient = await experimental_createMCPClient({
      transport: {
        type: 'sse',
        url,
      },
    });

    console.log('MCP Cliente creado exitosamente');

    // Intentamos obtener información del servidor MCP
    // Primero obtenemos las tools disponibles
    const mcpTools = await mcpClient.tools();
    console.log('MCP Tools:', Object.keys(mcpTools));

    // Obtener información del servidor MCP
    // Nota: serverInfo y resources podrían no estar disponibles dependiendo de la versión del SDK
    // por lo que usamos try/catch
    let serverInfo: any = {};
    let mcpResources: any[] = [];

    try {
      // @ts-ignore - serverInfo podría no estar disponible en todos los tipos de MCPClient
      serverInfo = await mcpClient.serverInfo?.();
      console.log('MCP Server Info:', JSON.stringify(serverInfo, null, 2));
    } catch (infoError) {
      console.log(
        'Error al obtener información del servidor (posiblemente no soportado):',
        infoError,
      );
    }

    try {
      // @ts-ignore - resources podría no estar disponible en todos los tipos de MCPClient
      mcpResources = await mcpClient.resources?.();
      console.log('MCP Resources:', JSON.stringify(mcpResources, null, 2));
    } catch (resourceError) {
      console.log(
        'Error al obtener recursos (posiblemente no soportados):',
        resourceError,
      );
    }

    // Procesar las tools para que sean seguras para serializar
    const safeTools = extractSafeToolInfo(mcpTools);

    // Detectar capacidades del servidor MCP
    const capabilities = {
      tools: Object.keys(mcpTools).length > 0,
      resources: Array.isArray(mcpResources) && mcpResources.length > 0,
      prompts: false, // Por ahora no verificamos prompts
      sampling: false, // Por ahora no verificamos sampling
    };

    // Si no hay información del servidor, generamos nombre y descripción usando AI
    let mcpName = serverInfo?.name;
    let mcpDescription = serverInfo?.description;
    let isAiGenerated = false;

    // Si no hay nombre o descripción, generamos con AI
    if (!mcpName || !mcpDescription) {
      console.log('Generando nombre y descripción del MCP con AI...');
      const generatedInfo = await generateMcpInfo(url, safeTools);
      mcpName = mcpName || generatedInfo.name;
      mcpDescription = mcpDescription || generatedInfo.description;
      isAiGenerated = true;
    }

    // Si llegamos aquí, la conexión fue exitosa
    return {
      success: true,
      data: {
        name: mcpName,
        description: mcpDescription,
        capabilities,
        serverInfo: {
          name: serverInfo?.name || '',
          description: serverInfo?.description || '',
          version: serverInfo?.version || '',
        },
        tools: safeTools,
        toolCount: Object.keys(mcpTools).length,
        isAiGenerated,
      },
    };
  } catch (error) {
    console.error('Error al validar MCP:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al conectar con el servidor MCP',
    };
  }
}

/**
 * Crear un nuevo MCP en la base de datos
 */
export async function createMcp(formData: FormData) {
  try {
    const url = formData.get('url') as string;

    if (!url) {
      return { success: false, error: 'La URL es requerida' };
    }

    // Obtener información del usuario
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return {
        success: false,
        error: 'Debes iniciar sesión para crear un MCP',
      };
    }

    const userId = session.user.id;
    console.log('ID del usuario:', userId);

    // Verificar si el usuario ya tiene un MCP con esta URL
    const existingMcps = await getMCPsByUserId({ userId });
    const mcpWithSameUrl = existingMcps.find((mcp) => mcp.url === url);

    if (mcpWithSameUrl) {
      return {
        success: false,
        error:
          'Ya tienes un MCP registrado con esta URL. No puedes crear duplicados.',
      };
    }

    // Validar la URL del MCP
    const validationResult = await validateMcpUrl(url);
    console.log('Resultado de validación de MCP:', validationResult);

    if (!validationResult.success || !validationResult.data) {
      return validationResult;
    }

    // Preparar datos para guardar
    const mcpToSave = {
      name: validationResult.data.name,
      type: 'sse' as const,
      url,
      isActive: true,
      userId,
      description: validationResult.data.description,
      capabilities: validationResult.data.capabilities,
      tools: validationResult.data.tools,
    };

    console.log('MCP listo para ser guardado en la base de datos:', mcpToSave);

    // Ahora podemos guardar en la base de datos
    const newMcp = await createMCP(mcpToSave);

    // Siempre revalidamos la ruta para asegurarnos de mostrar datos actualizados
    revalidatePath('/mcp');

    return {
      success: true,
      data: {
        ...mcpToSave,
        id: newMcp?.id || 'mcp-id',
        toolCount: validationResult.data.toolCount,
        tools: Object.keys(validationResult.data.tools || {}),
        isAiGenerated: validationResult.data.isAiGenerated,
      },
    };
  } catch (error) {
    console.error('Error al crear MCP:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear MCP',
    };
  }
}

/**
 * Activa o desactiva un MCP
 */
export async function toggleMcpActive(id: string) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await auth();
    if (!session || !session.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión para modificar un MCP',
      };
    }

    // Verificar que el MCP existe y pertenece al usuario
    const mcp = await getMCPById({ id });

    if (!mcp) {
      return {
        success: false,
        error: 'MCP no encontrado',
      };
    }

    if (mcp.userId !== session.user.id) {
      return {
        success: false,
        error: 'No tienes permiso para modificar este MCP',
      };
    }

    // Cambiar el estado del MCP (activo/inactivo)
    const updatedMCP = await toggleMCPActive({ id });

    // Revalidar la ruta para actualizar la UI
    revalidatePath('/mcp/list');

    return {
      success: true,
      data: updatedMCP,
    };
  } catch (error) {
    console.error('Error cambiando estado del MCP:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al cambiar el estado del MCP',
    };
  }
}

/**
 * Eliminar un MCP
 */
export async function deleteMcp(id: string) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await auth();
    if (!session || !session.user) {
      return {
        success: false,
        error: 'Debes iniciar sesión para eliminar un MCP',
      };
    }

    // Verificar que el MCP existe y pertenece al usuario
    const mcp = await getMCPById({ id });

    if (!mcp) {
      return {
        success: false,
        error: 'MCP no encontrado',
      };
    }

    if (mcp.userId !== session.user.id) {
      return {
        success: false,
        error: 'No tienes permiso para eliminar este MCP',
      };
    }

    // Eliminar el MCP
    const deletedMCP = await deleteMCPById({ id });

    // Revalidar la ruta para actualizar la UI
    revalidatePath('/mcp/list');

    return {
      success: true,
      data: deletedMCP,
    };
  } catch (error) {
    console.error('Error eliminando MCP:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al eliminar el MCP',
    };
  }
}
