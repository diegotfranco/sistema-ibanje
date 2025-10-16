import { AppSidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { ReactNode } from 'react';

type MenuLayoutProps = {
  children?: ReactNode;
};

export const MenuLayout = ({ children }: MenuLayoutProps) => (
  <SidebarProvider>
    <AppSidebar />
    <div className="flex-1 overflow-y-auto bg-gray-100">
      <Topbar />
      <main>{children}</main>
    </div>
  </SidebarProvider>
);
