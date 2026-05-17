import type { AppRoute } from '@/routes';
import { paths } from '@/lib/paths';
import { hasPermission, Action, type PermissionMap } from '@/lib/permissions';

export function filterRoutesByPermission(
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

export function isRouteActive(
  route: AppRoute,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  if (!route.path) return false;

  // Handle deep-linked query parameters (e.g., /reports?tab=income)
  if (route.path.includes('?')) {
    const [pathPart, queryPart] = route.path.split('?');
    const queryParams = new URLSearchParams(queryPart);

    if (pathname !== pathPart) return false;

    for (const [key, value] of queryParams) {
      if (searchParams.get(key) !== value) return false;
    }

    return true;
  }

  return pathname === route.path || (route.path !== '/' && pathname.startsWith(`${route.path}/`));
}

export function hasActiveDescendant(
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
