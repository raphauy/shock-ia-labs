'use client';

import { deleteMcp, toggleMcpActive } from '@/app/(chat)/mcp/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { MCP } from '@/lib/db/schema';
import { MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface McpCardProps {
  mcp: MCP;
}

// Interfaz para las herramientas y sus parámetros
interface ToolParameter {
  description?: string;
  [key: string]: any;
}

interface ToolParameters {
  properties: Record<string, ToolParameter>;
  [key: string]: any;
}

interface Tool {
  name?: string;
  description?: string;
  parameters?: ToolParameters;
  [key: string]: any;
}

export function McpCard({ mcp }: McpCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calcular el número de herramientas si existen
  const tools = mcp.tools as Record<string, Tool> | undefined;
  const toolsCount = tools ? Object.keys(tools).length : 0;

  const handleToggleMcpActive = async (mcpId: string) => {
    setIsUpdating(true);
    setUpdatingId(mcpId);
    try {
      const result = await toggleMcpActive(mcpId);

      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar el estado del MCP');
      }

      toast.success('Estado del MCP actualizado');
      router.refresh();
    } catch (error) {
      console.error('Error al cambiar estado del MCP:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al cambiar el estado del MCP',
      );
    } finally {
      setIsUpdating(false);
      setUpdatingId(null);
    }
  };

  const handleDeleteMcp = async (mcpId: string) => {
    const confirmed = confirm('¿Estás seguro de que deseas eliminar este MCP?');
    if (!confirmed) return;

    setIsUpdating(true);
    setUpdatingId(mcpId);
    try {
      const result = await deleteMcp(mcpId);

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar el MCP');
      }

      toast.success('MCP eliminado correctamente');
      router.refresh();
    } catch (error) {
      console.error('Error al eliminar MCP:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar el MCP',
      );
    } finally {
      setIsUpdating(false);
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{mcp.name}</CardTitle>
              <CardDescription className="mt-1.5 line-clamp-2">
                {mcp.description || 'Sin descripción'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical size={16} />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleToggleMcpActive(mcp.id)}
                  disabled={isUpdating && updatingId === mcp.id}
                >
                  {isUpdating && updatingId === mcp.id
                    ? 'Procesando...'
                    : mcp.isActive
                      ? 'Desactivar'
                      : 'Activar'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteMcp(mcp.id)}
                  className="text-destructive focus:text-destructive"
                  disabled={isUpdating && updatingId === mcp.id}
                >
                  {isUpdating && updatingId === mcp.id
                    ? 'Procesando...'
                    : 'Eliminar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-sm font-medium">URL: </span>
              <span className="text-sm text-muted-foreground break-all">
                {mcp.url}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">Tipo: </span>
              <span className="text-sm text-muted-foreground">
                {mcp.type.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={mcp.isActive ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {mcp.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                {mcp.capabilities && (
                  <>
                    {mcp.capabilities.resources && (
                      <Badge variant="outline">Recursos</Badge>
                    )}
                    {mcp.capabilities.prompts && (
                      <Badge variant="outline">Prompts</Badge>
                    )}
                    {mcp.capabilities.sampling && (
                      <Badge variant="outline">Sampling</Badge>
                    )}
                  </>
                )}
              </div>
              {mcp.capabilities?.tools && (
                <ToolsDialog
                  tools={tools}
                  toolsCount={toolsCount}
                  open={dialogOpen}
                  onOpenChange={setDialogOpen}
                  mcpName={mcp.name}
                  mcpDescription={mcp.description ?? undefined}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Componente para mostrar el diálogo de tools
function ToolsDialog({
  tools,
  toolsCount,
  open,
  onOpenChange,
  mcpName,
  mcpDescription,
}: {
  tools: Record<string, Tool> | undefined;
  toolsCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mcpName: string;
  mcpDescription?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
          {toolsCount} {toolsCount === 1 ? 'tool' : 'tools'}
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{mcpName}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {mcpDescription || 'Sin descripción disponible'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grow">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-medium">
              Tools disponibles ({toolsCount})
            </h3>
          </div>

          <ScrollArea className="h-[calc(70vh-10rem)] rounded-md border">
            <div className="space-y-4 p-4">
              {tools &&
                Object.entries(tools).map(([key, tool]) => (
                  <div
                    key={key}
                    className="border rounded-md p-4 hover:border-primary/50 transition-colors"
                  >
                    <h4 className="font-semibold text-base">
                      {tool.name || key}
                    </h4>
                    {tool.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {tool.description}
                      </p>
                    )}
                    {tool.parameters?.properties &&
                      Object.keys(tool.parameters.properties).length > 0 && (
                        <div className="mt-3 bg-muted/40 p-3 rounded-md">
                          <h5 className="text-sm font-medium mb-2">
                            Parameters:
                          </h5>
                          <div className="space-y-2 pl-2">
                            {Object.entries(tool.parameters.properties).map(
                              ([paramKey, param]) => (
                                <div key={paramKey} className="text-sm">
                                  <span className="font-medium text-primary/80">
                                    {paramKey}
                                  </span>
                                  {param.description && (
                                    <span className="text-muted-foreground ml-2">
                                      - {param.description}
                                    </span>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
