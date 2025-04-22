'use client';

import { useRouter } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusIcon, FileIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export default function SidebarMcpActions() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleNavigation = (path: string) => {
    setOpenMobile(false);
    router.push(path);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>MCP</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <div className="flex flex-col gap-2 px-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal h-9"
                  onClick={() => handleNavigation('/mcp/list')}
                >
                  <FileIcon size={16} />
                  <span>Listar MCPs</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Ver todos los MCPs</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal h-9"
                  onClick={() => handleNavigation('/mcp/new')}
                >
                  <PlusIcon size={16} />
                  <span>Nuevo MCP</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Crear un nuevo MCP</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
