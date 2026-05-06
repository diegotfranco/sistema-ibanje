import { Outlet } from 'react-router';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={100}>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-background overflow-hidden h-screen text-foreground relative">
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20">
            <ThemeToggle />
          </div>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background mt-14 lg:mt-0">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
