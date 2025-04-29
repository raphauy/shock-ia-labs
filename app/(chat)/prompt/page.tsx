import { getUserPrompt } from '@/lib/db/queries';
import { PromptEditor } from './prompt-editor';
import { auth } from '@/app/(auth)/auth';

export default async function PromptPage() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const initialPrompt = await getUserPrompt({ userId: session.user.id });

  if (!initialPrompt) {
    throw new Error('No se pudo obtener el prompt');
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Configuración del Prompt</h1>
      <PromptEditor initialPrompt={initialPrompt} />
    </div>
  );
}
