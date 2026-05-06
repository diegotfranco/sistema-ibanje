import { Outlet } from 'react-router';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function AppLayout() {
  const { data: user } = useCurrentUser();

  return (
    <TooltipProvider delayDuration={100}>
      <SidebarProvider>
        <Sidebar />

        <SidebarInset className="flex flex-col min-w-0 bg-background overflow-hidden h-screen text-foreground">
          <header className="h-16 bg-primary text-primary-foreground border-b border-primary-foreground/10 px-6 flex items-center justify-end transition-colors shrink-0">
            <div className="flex items-center gap-4">
              {user && <span className="text-sm font-medium">{user.name}</span>}
              <div className="h-5 w-px bg-primary-foreground/30 mx-1"></div>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
