import { NavLink } from 'react-router';
import type { AppRoute } from '@/routes';
import { appRoutes } from '@/routes';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { hasPermission, Action } from '@/lib/permissions';

function NavLinkItem({ route }: { route: AppRoute }) {
  const baseClasses =
    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium';
  const activeClasses = 'bg-teal-800 text-white';
  const inactiveClasses = 'text-teal-100 hover:bg-teal-800/60';

  const Icon = route.icon;

  return (
    <NavLink
      to={route.path}
      className={({ isActive }) => cn(baseClasses, isActive ? activeClasses : inactiveClasses)}>
      {Icon && <Icon className="h-4 w-4" />}
      <span>{route.label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const { data: user } = useCurrentUser();

  const visibleRoutes = appRoutes.filter(
    (route) =>
      route.layout === 'app' &&
      route.label &&
      (!route.module || hasPermission(user?.permissions, route.module, route.action ?? Action.View))
  );

  return (
    <aside className="w-64 bg-teal-900 text-slate-50 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-teal-800">
        <div className="text-base font-light">Sistema Ibanje</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleRoutes.map((route) => {
          if (!route.children || route.children.length === 0) {
            return <NavLinkItem key={route.path} route={route} />;
          }

          const visibleChildren = route.children.filter(
            (child) =>
              child.layout === 'app' &&
              child.label &&
              (!child.module ||
                hasPermission(user?.permissions, child.module, child.action ?? Action.View))
          );

          // Hide parent group if no children are visible
          if (visibleChildren.length === 0) {
            return null;
          }

          return (
            <div key={route.path}>
              {route.label && (
                <div className="text-xs uppercase tracking-wider text-teal-300 px-3 pt-4 pb-2">
                  {route.label}
                </div>
              )}
              {visibleChildren.map((child) => (
                <NavLinkItem key={child.path} route={child} />
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
