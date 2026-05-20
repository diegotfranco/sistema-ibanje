import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { Sidebar } from '@/components/Sidebar';
import { Breadcrumbs } from '@/components/Breadcrumbs';
// import { ThemeToggle } from '@/components/ThemeToggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ErrorPage } from '@/components/status/ErrorPage';

export function AppLayout() {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={100}>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-background overflow-hidden h-screen text-foreground relative">
          <header className="flex h-14 items-center justify-between bg-sidebar border-b border-sidebar-border px-4 md:hidden">
            <SidebarTrigger />
            {/* <ThemeToggle /> */}
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="min-h-full bg-muted p-6 lg:p-8">
              <Breadcrumbs />
              <ErrorBoundary FallbackComponent={ErrorPage} resetKeys={[location.pathname]}>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
