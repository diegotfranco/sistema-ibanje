import { NavLink, useLocation } from 'react-router';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { appRoutes } from '@/routes';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { hasPermission, Action } from '@/lib/permissions';
import { useLogout } from '@/modules/auth/useLogout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

export function Sidebar() {
  const { data: user } = useCurrentUser();
  const { logout, isPending } = useLogout();
  const location = useLocation();

  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const visibleRoutes = appRoutes.filter(
    (route) =>
      route.layout === 'app' &&
      route.label &&
      (!route.module || hasPermission(user?.permissions, route.module, route.action ?? Action.View))
  );

  return (
    <ShadcnSidebar collapsible="icon">
      {/* Custom Top Header Section */}
      <SidebarHeader className="h-16 justify-center p-0 border-b border-sidebar-border">
        <div
          className={cn(
            'flex items-center w-full transition-all',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-semibold text-sm truncate">Sistema Ibanje</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0">
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        {visibleRoutes.map((route, index) => {
          if (!route.children || route.children.length === 0) {
            const isActive = route.path
              ? location.pathname === route.path ||
                (route.path !== '/' && location.pathname.startsWith(`${route.path}/`))
              : false;

            return (
              <SidebarGroup key={route.path || index} className="py-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={route.label}>
                      <NavLink to={route.path!}>
                        {route.icon && <route.icon />}
                        <span>{route.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          }

          const visibleChildren = route.children.filter(
            (child) =>
              child.layout === 'app' &&
              child.label &&
              (!child.module ||
                hasPermission(user?.permissions, child.module, child.action ?? Action.View))
          );

          if (visibleChildren.length === 0) return null;

          return (
            <SidebarGroup key={route.path ?? route.label}>
              <SidebarGroupLabel className="truncate">{route.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleChildren.map((child) => {
                    const isActive = child.path
                      ? location.pathname === child.path ||
                        (child.path !== '/' && location.pathname.startsWith(`${child.path}/`))
                      : false;

                    return (
                      <SidebarMenuItem key={child.path}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={child.label}>
                          <NavLink to={child.path!}>
                            {child.icon && <child.icon />}
                            <span>{child.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Bottom Actions */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              disabled={isPending}
              tooltip="Sair"
              className="text-muted-foreground hover:text-foreground">
              <LogOut />
              <span>{isPending ? 'Saindo...' : 'Sair'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
