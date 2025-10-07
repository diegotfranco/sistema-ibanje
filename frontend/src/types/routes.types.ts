import type { RouteObject } from 'react-router';

export type Route = RouteObject & {
  name: string;
  hasMenu?: boolean;
  isProtected?: boolean;
  isVisible?: boolean;
  permission?: string;
};
