import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { appRoutes, type AppRoute } from '@/routes';

type Crumb = { label: string; path?: string };

function findTrail(routes: AppRoute[], pathname: string, trail: Crumb[] = []): Crumb[] | null {
  for (const route of routes) {
    const next: Crumb[] = route.label
      ? [...trail, { label: route.label, path: route.path }]
      : trail;
    if (route.path && route.path === pathname) return next;
    if (route.children) {
      const found = findTrail(route.children, pathname, next);
      if (found) return found;
    }
  }
  return null;
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const trail = findTrail(appRoutes, pathname);
  if (!trail || trail.length < 1) return null;

  return (
    <nav aria-label="breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-sm">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          return (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && (
                <ChevronRight size={14} className="text-muted-foreground/60" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : crumb.path ? (
                <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-muted-foreground">{crumb.label}</span>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
