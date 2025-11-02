import type { Route } from '@/types/routes.types';
import { MenuLayout } from './MenuLayout';
import { PlainLayout } from './PlainLayout';
import { ProtectedLayout } from './ProtectedLayout';

export function resolveLayout(route: Route) {
  const { element, hasMenu, permission } = route;

  if (permission) {
    const protectedElement = (
      <ProtectedLayout module={permission.module} action={permission.action}>
        {element}
      </ProtectedLayout>
    );

    return hasMenu ? <MenuLayout>{protectedElement}</MenuLayout> : protectedElement;
  }

  // Public routes
  return hasMenu ? <MenuLayout>{element}</MenuLayout> : <PlainLayout>{element}</PlainLayout>;
}
