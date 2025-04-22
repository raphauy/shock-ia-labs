'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { createMcp } from '@/app/(chat)/mcp/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export function NewMcpForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingInfo, setIsGeneratingInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para almacenar la información del MCP validado
  const [validatedMcp, setValidatedMcp] = useState<{
    name: string;
    description: string;
    tools: string[];
    toolCount: number;
    isAiGenerated?: boolean;
  } | null>(null);

  // Manejar cambios en el input de URL
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Reseteamos el MCP validado cuando cambia la URL
    setValidatedMcp(null);
    setError(null);
  };

  // Validar la URL del MCP
  const handleValidate = async () => {
    if (!url.trim()) {
      toast.error('Por favor introduce una URL válida');
      return;
    }

    setIsValidating(true);
    setIsGeneratingInfo(false);
    setError(null);

    try {
      // Construir el FormData para la acción
      const formData = new FormData();
      formData.append('url', url);

      // Esta acción ahora puede generar el nombre/descripción con AI
      const result = await createMcp(formData);

      if (result.success && result.data) {
        // Si se usó AI para generar el nombre/descripción, mostrar mensaje
        if (result.data.isAiGenerated) {
          setIsGeneratingInfo(true);
          toast.success('Generando nombre y descripción con AI...');

          // Simulamos una espera para dar sensación de que la AI está trabajando
          setTimeout(() => {
            setIsGeneratingInfo(false);
            toast.success('MCP validado correctamente');
            setValidatedMcp({
              name: result.data.name,
              description: result.data.description || '',
              tools: Array.isArray(result.data.tools) ? result.data.tools : [],
              toolCount: result.data.toolCount || 0,
              isAiGenerated: true,
            });
          }, 1500);
        } else {
          toast.success('MCP validado correctamente');
          setValidatedMcp({
            name: result.data.name,
            description: result.data.description || '',
            tools: Array.isArray(result.data.tools) ? result.data.tools : [],
            toolCount: result.data.toolCount || 0,
          });
        }
      } else {
        // Asegurarse de que errorMessage sea siempre un string y nunca undefined
        const errorMessage =
          'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Error al validar el MCP';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error al validar el MCP:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al validar el MCP';
      toast.error(errorMessage);
      setError(errorMessage);
      setIsGeneratingInfo(false);
    } finally {
      setIsValidating(false);
    }
  };

  // Guardar el MCP en la base de datos
  const handleSave = async () => {
    if (!validatedMcp) {
      toast.error('Primero debes validar el MCP');
      return;
    }

    setIsSaving(true);

    try {
      // El MCP ya se guardó durante la validación
      toast.success('MCP guardado correctamente');

      // Redirigir al usuario a la lista de MCPs
      router.push('/mcp/list');
      router.refresh();
    } catch (error) {
      console.error('Error al guardar el MCP:', error);
      toast.error('Ocurrió un error al guardar el MCP');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Información del MCP</h3>
        <p className="text-sm text-muted-foreground">
          Introduce la URL del servidor MCP que deseas agregar.
        </p>
      </div>

      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleValidate();
          }}
          className="space-y-2"
        >
          <Label htmlFor="url">URL del servidor MCP</Label>
          <Input
            id="url"
            placeholder="https://example.com/mcp"
            value={url}
            onChange={handleUrlChange}
            disabled={isValidating || isSaving || isGeneratingInfo}
          />
          <p className="text-xs text-muted-foreground">
            Por ejemplo: https://actions.zapier.com/mcp/sk-ak-xxxxxxxxxxx/sse
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 mt-4">
            <Button
              type="submit"
              disabled={
                !url.trim() || isValidating || isSaving || isGeneratingInfo
              }
            >
              {isValidating
                ? 'Validando...'
                : isGeneratingInfo
                  ? 'Generando información...'
                  : 'Validar URL'}
            </Button>
          </div>
        </form>

        {validatedMcp && (
          <div className="mt-6 p-4 border rounded-md space-y-4">
            <div>
              <h4 className="font-medium">MCP Validado correctamente</h4>
              <p className="text-sm text-muted-foreground">
                {validatedMcp.isAiGenerated
                  ? 'El nombre y descripción fueron generados automáticamente usando IA.'
                  : 'El MCP ha sido validado y está listo para ser guardado.'}
              </p>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-medium">Nombre:</span> {validatedMcp.name}
                {validatedMcp.isAiGenerated && (
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                    Generado con IA
                  </span>
                )}
              </div>
              {validatedMcp.description && (
                <div>
                  <span className="font-medium">Descripción:</span>{' '}
                  {validatedMcp.description}
                  {validatedMcp.isAiGenerated && (
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      Generado con IA
                    </span>
                  )}
                </div>
              )}
              <div>
                <span className="font-medium">Herramientas:</span>{' '}
                {validatedMcp.toolCount}
              </div>
              {validatedMcp.tools.length > 0 && (
                <div>
                  <span className="font-medium">Lista de herramientas:</span>
                  <ul className="ml-4 text-sm list-disc">
                    {validatedMcp.tools.map((tool) => (
                      <li key={tool}>{tool}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Guardando...' : 'Guardar MCP'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
