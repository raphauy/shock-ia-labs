'use client';

import { useState } from 'react';
import { updatePrompt } from '../actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader, Save } from 'lucide-react';

interface PromptEditorProps {
  initialPrompt: string;
}

export function PromptEditor({ initialPrompt }: PromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updatePrompt(prompt);
      toast.success('Prompt actualizado', {
        description: 'Tu prompt ha sido actualizado correctamente.',
      });
    } catch (error) {
      toast.error('Error al actualizar el prompt', {
        description: 'No se pudo actualizar el prompt.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={20}
        placeholder="Escribe tu prompt personalizado aquí..."
      />
      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? (
          <Loader className="animate-spin size-4" />
        ) : (
          <Save className="size-4" />
        )}
        <p>Guardar Prompt</p>
      </Button>
    </div>
  );
}
