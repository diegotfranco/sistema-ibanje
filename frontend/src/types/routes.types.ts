import type { RouteObject } from 'react-router';
import type { ReactElement } from 'react';

export type Route = RouteObject & {
  name: string;
  hasMenu?: boolean;
  isProtected?: boolean;
  isVisible?: boolean;
  permission?: { area: number; acao: number };
  icon?: ReactElement;
};
