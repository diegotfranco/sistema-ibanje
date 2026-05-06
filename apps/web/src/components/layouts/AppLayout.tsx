import { Outlet } from 'react-router';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLogout } from '@/modules/auth/useLogout';

export function AppLayout() {
  const { data: user } = useCurrentUser();
  const { logout, isPending } = useLogout();

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 bg-background border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="text-lg font-light underline underline-offset-8 decoration-teal-600 decoration-1">
            Sistema Ibanje
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && <span className="text-sm text-slate-600">{user.name}</span>}
            <Button variant="outline" size="sm" onClick={() => logout()} disabled={isPending}>
              {isPending ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
