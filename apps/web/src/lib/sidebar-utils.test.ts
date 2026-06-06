import { describe, it, expect } from 'vitest';
import type { AppRoute } from '@/routes';
import { Module, Action, type PermissionMap } from '@/lib/permissions';
import { filterRoutesByPermission, isRouteActive, hasActiveDescendant } from './sidebar-utils';

// hasPermission uses a bitmask: perms[module] has bit (action-1) set. View=1 → bit 0 → value 1.
const viewBit = 1 << (Action.View - 1);
const grant = (...modules: Module[]): PermissionMap =>
  Object.fromEntries(modules.map((m) => [m, viewBit]));

const sp = (qs = '') => new URLSearchParams(qs);

const attendersRoute: AppRoute = {
  path: '/attenders',
  layout: 'app',
  label: 'Congregados',
  module: Module.Attenders,
  action: Action.View
};
const usersRoute: AppRoute = {
  path: '/users',
  layout: 'app',
  label: 'Usuários',
  module: Module.Users,
  action: Action.View
};
const dashboardRoute: AppRoute = { path: '/dashboard', layout: 'app', label: 'Início' };

describe('filterRoutesByPermission', () => {
  it('keeps only routes the user has permission for', () => {
    const result = filterRoutesByPermission([attendersRoute, usersRoute], {
      permissions: grant(Module.Attenders)
    });
    expect(result.map((r) => r.path)).toEqual(['/attenders']);
  });

  it('always keeps the dashboard/home leaf even without a module', () => {
    const result = filterRoutesByPermission([dashboardRoute], { permissions: grant() });
    expect(result).toHaveLength(1);
  });

  it('drops a section whose children are all forbidden', () => {
    const section: AppRoute = {
      layout: 'app',
      label: 'Finanças',
      children: [usersRoute]
    };
    const result = filterRoutesByPermission([section], { permissions: grant(Module.Attenders) });
    expect(result).toHaveLength(0);
  });

  it('keeps a section with at least one permitted child, pruning the rest', () => {
    const section: AppRoute = {
      layout: 'app',
      label: 'Cadastros',
      children: [attendersRoute, usersRoute]
    };
    const result = filterRoutesByPermission([section], { permissions: grant(Module.Attenders) });
    expect(result).toHaveLength(1);
    expect(result[0].children?.map((c) => c.path)).toEqual(['/attenders']);
  });

  it('hides non-app (auth) layout routes', () => {
    const login: AppRoute = { path: '/login', layout: 'auth', label: 'Login' };
    expect(filterRoutesByPermission([login], { permissions: grant() })).toHaveLength(0);
  });

  it('returns nothing for a null user', () => {
    expect(filterRoutesByPermission([attendersRoute], null)).toHaveLength(0);
  });
});

describe('isRouteActive', () => {
  it('matches an exact pathname', () => {
    expect(isRouteActive(attendersRoute, '/attenders', sp())).toBe(true);
  });

  it('matches a nested detail pathname under the route', () => {
    expect(isRouteActive(attendersRoute, '/attenders/42', sp())).toBe(true);
  });

  it('does not match an unrelated pathname', () => {
    expect(isRouteActive(attendersRoute, '/users', sp())).toBe(false);
  });

  it('matches a query-parameterized route only when the param matches', () => {
    const tabRoute: AppRoute = { path: '/reports?tab=income', layout: 'app', label: 'Entradas' };
    expect(isRouteActive(tabRoute, '/reports', sp('tab=income'))).toBe(true);
    expect(isRouteActive(tabRoute, '/reports', sp('tab=expenses'))).toBe(false);
    expect(isRouteActive(tabRoute, '/other', sp('tab=income'))).toBe(false);
  });

  it('returns false for a pathless section route', () => {
    expect(isRouteActive({ layout: 'app', label: 'Seção' }, '/x', sp())).toBe(false);
  });
});

describe('hasActiveDescendant', () => {
  it('returns true when a child route is active', () => {
    const section: AppRoute = { layout: 'app', label: 'Cadastros', children: [attendersRoute] };
    expect(hasActiveDescendant(section, '/attenders', sp())).toBe(true);
  });

  it('returns false when no descendant matches', () => {
    const section: AppRoute = { layout: 'app', label: 'Cadastros', children: [attendersRoute] };
    expect(hasActiveDescendant(section, '/users', sp())).toBe(false);
  });

  it('returns false for a leaf route with no children', () => {
    expect(hasActiveDescendant(attendersRoute, '/attenders', sp())).toBe(false);
  });
});
