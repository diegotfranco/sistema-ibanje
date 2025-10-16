import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { routes } from '@/routes/Routes';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/utils';
import { useCallback } from 'react';
import type { Route } from '@/types/routes.types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export function AppSidebar() {
  const can = useAuthStore((s) => s.can);
  const location = useLocation().pathname;

  const renderRoute = useCallback(
    (route: Route): boolean => {
      if (route.isVisible === false) return false;
      if (route.permission && !can(route.permission.area, route.permission.acao)) return false;
      if (route.children?.length) return route.children.some((child: Route) => renderRoute(child));
      return true;
    },
    [can]
  );

  const groupedRoutes = useCallback(
    () =>
      routes.reduce(
        (acc, route) => {
          if (!route.group || !renderRoute(route)) return acc;
          if (!acc[route.group]) acc[route.group] = [];
          acc[route.group].push(route);
          return acc;
        },
        {} as Record<string, typeof routes>
      ),
    [renderRoute]
  );

  return (
    <Sidebar collapsible="icon" className="group/sidebar">
      <SidebarContent>
        {Object.entries(groupedRoutes()).map(([group, routes]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {routes.map((route) => {
                  const hasChildren = route.children?.some((child: Route) => renderRoute(child));

                  if (hasChildren) {
                    return (
                      <SidebarMenuItem key={route.name}>
                        <Collapsible defaultOpen className="group/collapsible">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className={cn(
                                'flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md text-sm w-full',
                                route.path && location.startsWith(route.path)
                                  ? 'bg-slate-200'
                                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                              )}>
                              {route.icon}
                              <span className="group-data-[state=collapsed]/sidebar:hidden">
                                {route.name}
                              </span>
                              <ChevronDown className="group-data-[state=collapsed]/sidebar:hidden ml-auto transition-transform group-data-[state=open]/collapsible:rotate-0 -rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {route.children
                                ?.filter((child: Route) => renderRoute(child))
                                .map((child) => (
                                  <SidebarMenuSubItem key={child.name}>
                                    <SidebarMenuButton
                                      asChild
                                      className={cn(
                                        'flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md text-sm w-full',
                                        (child.fullPath ?? child.path) == location
                                          ? 'text-teal-600 underline underline-offset-3'
                                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                      )}>
                                      <NavLink to={(child.fullPath ?? child.path)!}>
                                        {child.icon}
                                        <span className="group-data-[state=collapsed]/sidebar:hidden">
                                          {child.name}
                                        </span>
                                      </NavLink>
                                    </SidebarMenuButton>
                                  </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  }

                  // No children -> regular menu item
                  return (
                    <SidebarMenuItem key={route.name}>
                      <SidebarMenuButton
                        asChild
                        className={cn(
                          'flex items-center gap-2 px-2 py-1 cursor-pointer rounded-md text-sm w-full',
                          (route.fullPath ?? route.path) == location
                            ? 'text-teal-600 underline underline-offset-3'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}>
                        <NavLink to={(route.fullPath ?? route.path)!}>
                          {route.icon}
                          <span className="group-data-[state=collapsed]/sidebar:hidden">{route.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
