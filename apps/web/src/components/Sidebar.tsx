import { useState, type ReactElement } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, User } from 'lucide-react';
import { appRoutes, type AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import { hasPermission, Action, Module, type PermissionMap } from '@/lib/permissions';
import { useLogout } from '@/modules/auth/useLogout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// Make sure to import these Dropdown components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar
} from '@/components/ui/sidebar';

// Hook to manage sub-group collapse state in localStorage
function useSubgroupState() {
  const [state, setState] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem('sidebar-subgroups');
    if (stored) {
      try {
        return JSON.parse(stored) as Record<string, boolean>;
      } catch {
        // Ignore parse errors
        return {};
      }
    }
    return {};
  });

  const setOpenState = (key: string, isOpen: boolean) => {
    setState((prev) => {
      const newState = { ...prev, [key]: isOpen };
      localStorage.setItem('sidebar-subgroups', JSON.stringify(newState));
      return newState;
    });
  };

  return { state, setOpenState };
}

// Recursive helper to filter routes by permission
function filterRoutesByPermission(
  routes: AppRoute[],
  user:
    | {
        permissions?: PermissionMap;
      }
    | null
    | undefined
): AppRoute[] {
  return routes
    .map((route) => {
      // Início is rendered for every authenticated user; the leaf redirects
      // attenders to /me at render time. The /dashboard URL itself stays
      // gated by RequirePermission.
      const isHomeLeaf = route.path === paths.dashboard;
      const isVisible =
        route.layout === 'app' &&
        route.label &&
        (isHomeLeaf ||
          !route.module ||
          hasPermission(user?.permissions, route.module, route.action ?? Action.View));

      if (!isVisible) return null;

      if (route.children && route.children.length > 0) {
        const filteredChildren = filterRoutesByPermission(route.children, user);
        if (filteredChildren.length === 0) return null;
        return { ...route, children: filteredChildren };
      }

      return route;
    })
    .filter((r) => r !== null) as AppRoute[];
}

// Helper to check if a route is active
function isRouteActive(route: AppRoute, pathname: string, searchParams: URLSearchParams): boolean {
  if (!route.path) return false;

  // Handle deep-linked query parameters (e.g., /reports?tab=income)
  if (route.path.includes('?')) {
    const [pathPart, queryPart] = route.path.split('?');
    const queryParams = new URLSearchParams(queryPart);

    // Check if pathname matches
    if (pathname !== pathPart) return false;

    // Check all query params in the route path
    for (const [key, value] of queryParams) {
      if (searchParams.get(key) !== value) return false;
    }

    return true;
  }

  // Standard pathname matching
  return pathname === route.path || (route.path !== '/' && pathname.startsWith(`${route.path}/`));
}

function hasActiveDescendant(
  route: AppRoute,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  if (!route.children) return false;
  return route.children.some(
    (c) =>
      isRouteActive(c, pathname, searchParams) || hasActiveDescendant(c, pathname, searchParams)
  );
}

// Recursive component to render menu items
function MenuItemRenderer({
  route,
  depth,
  location,
  user,
  subgroupState,
  setOpenState
}: {
  route: AppRoute;
  depth: number;
  location: ReturnType<typeof useLocation>;
  user:
    | {
        permissions?: PermissionMap;
      }
    | null
    | undefined;
  subgroupState: Record<string, boolean>;
  setOpenState: (key: string, isOpen: boolean) => void;
}): ReactElement | null {
  const searchParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  // Depth 0: top-level section with children
  if (depth === 0 && route.children && route.children.length > 0) {
    return (
      <SidebarGroup key={route.label} className="py-2">
        <SidebarGroupLabel className="truncate">{route.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {route.children.map((child) => (
              <MenuItemRenderer
                key={child.path ?? child.label}
                route={child}
                depth={1}
                location={location}
                user={user}
                subgroupState={subgroupState}
                setOpenState={setOpenState}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Depth 1 with children: collapsible sub-group
  if (depth === 1 && route.children && route.children.length > 0) {
    const subgroupKey = route.label || '';
    const isOpen = subgroupState[subgroupKey] ?? true; // Default open
    const isParentActive = hasActiveDescendant(route, location.pathname, searchParams);

    // Collapsed (icon-only) sidebar: render parent icon as a flyout DropdownMenu
    // so sub-items remain reachable without expanding the rail.
    if (isCollapsed) {
      return (
        <SidebarMenuItem key={subgroupKey}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                tooltip={route.label}
                className={cn(
                  'gap-2 text-muted-foreground hover:text-foreground',
                  isParentActive && 'bg-sidebar-accent text-sidebar-primary'
                )}>
                {route.icon && <route.icon size={16} />}
                <span className="truncate">{route.label}</span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="min-w-48">
              <DropdownMenuLabel>{route.label}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {route.children.map((child) => {
                if (!child.path || !child.label) return null;
                const childActive = isRouteActive(child, location.pathname, searchParams);
                return (
                  <DropdownMenuItem
                    key={child.path}
                    onClick={() => navigate(child.path!)}
                    className={cn('cursor-pointer', childActive && 'bg-primary/5 text-foreground')}>
                    {child.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={subgroupKey}>
        <Collapsible open={isOpen} onOpenChange={(open) => setOpenState(subgroupKey, open)}>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'group/collapsible-trigger gap-2 text-muted-foreground hover:text-foreground',
                isParentActive && 'bg-sidebar-accent text-sidebar-primary'
              )}>
              {route.icon && <route.icon size={16} />}
              <span className="truncate">{route.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-trigger:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {route.children.map((child) => (
                <MenuItemRenderer
                  key={child.path ?? child.label}
                  route={child}
                  depth={2}
                  location={location}
                  user={user}
                  subgroupState={subgroupState}
                  setOpenState={setOpenState}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  }

  // Leaf item at any depth
  if (route.path && route.label) {
    const isActive = isRouteActive(route, location.pathname, searchParams);

    // Início (dashboard) leaf: resolve to /me when the user lacks Dashboard:View
    // so attenders land on their own portal from the same sidebar entry.
    const resolvedPath =
      route.path === paths.dashboard &&
      !hasPermission(user?.permissions, Module.Dashboard, Action.View)
        ? paths.me
        : route.path;

    const navElement = (
      <NavLink to={resolvedPath}>
        {route.icon && <route.icon size={16} />}
        <span className="truncate">{route.label}</span>
      </NavLink>
    );

    if (depth === 2) {
      return (
        <SidebarMenuSubItem key={route.path}>
          <SidebarMenuSubButton
            asChild
            isActive={isActive}
            className="text-muted-foreground hover:text-foreground data-active:text-foreground data-active:bg-sidebar-primary/10 data-active:font-normal">
            {navElement}
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      );
    }

    const menuItem = (
      <SidebarMenuItem key={route.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={route.label}
          className="text-muted-foreground hover:text-foreground data-active:text-sidebar-primary data-active:bg-sidebar-accent data-active:font-normal">
          {navElement}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

    if (depth === 0) {
      return (
        <SidebarGroup key={route.path} className="py-2">
          <SidebarGroupContent>
            <SidebarMenu>{menuItem}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return menuItem;
  }

  return null;
}

export function Sidebar() {
  const { data: user } = useCurrentUser();
  const { logout, isPending } = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  const { state: subgroupState, setOpenState } = useSubgroupState();

  const isCollapsed = state === 'collapsed';

  // Filter routes recursively by permissions
  const visibleRoutes = filterRoutesByPermission(appRoutes, user);

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
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0">
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        {visibleRoutes.map((route) => (
          <MenuItemRenderer
            key={route.path ?? route.label}
            route={route}
            depth={0}
            location={location}
            user={user}
            subgroupState={subgroupState}
            setOpenState={setOpenState}
          />
        ))}
      </SidebarContent>

      {/* Bottom Actions - User Menu Dropdown */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {isCollapsed ? (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-foreground">
                        <User size={14} />
                      </div>
                    ) : (
                      <span className="truncate text-sm font-medium">
                        {user?.name || 'Carregando...'}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 mb-2 z-10">
                <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(paths.me)} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Minha Conta</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => logout()}
                  disabled={isPending}
                  className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isPending ? 'Saindo...' : 'Sair'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
