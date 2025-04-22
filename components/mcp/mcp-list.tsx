'use client';

import type { MCP } from '@/lib/db/schema';
import { McpCard } from './mcp-card';

interface McpListProps {
  mcps: MCP[];
}

export function McpList({ mcps }: McpListProps) {
  if (!mcps || mcps.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">
          No hay MCPs configurados. Agrega uno para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {mcps.map((mcp) => (
        <McpCard key={mcp.id} mcp={mcp} />
      ))}
    </div>
  );
}
