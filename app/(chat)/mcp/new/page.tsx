import { NewMcpForm } from '@/components/mcp/new-mcp-form';
import { Separator } from '@/components/ui/separator';

export default function NewMcpPage() {
  return (
    <div className="container max-w-4xl py-6 lg:py-10 mx-auto">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">
            Agregar nuevo MCP
          </h1>
          <p className="text-lg text-muted-foreground">
            Agrega un nuevo servidor MCP para ser utilizado con tus
            conversaciones
          </p>
        </div>
      </div>
      <Separator className="my-4 md:my-6" />

      <div className="grid gap-10">
        <NewMcpForm />
      </div>
    </div>
  );
}
