import Link from 'next/link';
import { Plus } from 'lucide-react';
import { auth } from '@/app/(auth)/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getMCPsByUserId } from '@/lib/db/queries';
import { McpList } from '@/components/mcp/mcp-list';

export default async function ListMcpPage() {
  const session = await auth();

  // Obtener los MCPs del usuario desde la base de datos
  const mcps = session?.user?.id
    ? await getMCPsByUserId({ userId: session.user.id })
    : [];

  return (
    <div className="container max-w-4xl py-6 lg:py-10 mx-auto">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block text-4xl font-bold tracking-tight lg:text-5xl">
            Model Context Protocol (MCP)
          </h1>
          <p className="text-lg text-muted-foreground">
            Administra los servidores MCP que puedes utilizar en tus
            conversaciones
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/mcp/new">
            <Button className="text-xs md:text-sm">
              <Plus size={16} />
              <span className="ml-2">Nuevo MCP</span>
            </Button>
          </Link>
        </div>
      </div>
      <Separator className="my-4 md:my-6" />

      <div className="grid gap-10">
        {mcps.length > 0 ? (
          <McpList mcps={mcps} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-center">
              No hay MCPs configurados
            </h3>
            <p className="text-muted-foreground text-center mt-2">
              Aún no has configurado ningún servidor MCP. Comienza agregando uno
              nuevo.
            </p>
            <div className="mt-6">
              <Link href="/mcp/new">
                <Button>
                  <Plus size={16} />
                  <span className="ml-2">Agregar MCP</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
