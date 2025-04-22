import { redirect } from 'next/navigation';

export default function McpPage() {
  // Redirigir a la página de lista de MCPs
  redirect('/mcp/list');
}
