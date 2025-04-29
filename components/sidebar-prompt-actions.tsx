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
import { MessageIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { User } from 'next-auth';

export default function SidebarPromptActions({
  user,
}: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const handleNavigation = (path: string) => {
    setOpenMobile(false);
    router.push(path);
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Prompt</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <div className="flex flex-col gap-2 px-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal h-9"
                  onClick={() => handleNavigation('/prompt')}
                >
                  <MessageIcon size={16} />
                  <span>Configurar Prompt</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Personalizar tu prompt
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
