import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ErrorPage } from '@/components/status/ErrorPage';

export function AppLayout() {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={100}>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-background overflow-hidden h-screen text-foreground relative">
          <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20">
            <ThemeToggle />
          </div>
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-background mt-14 lg:mt-0">
            <ErrorBoundary FallbackComponent={ErrorPage} resetKeys={[location.pathname]}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
