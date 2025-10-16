import type { JSX } from 'react';
import type { RouteObject } from 'react-router';

export type Route = RouteObject & {
  name: string;
  hasMenu?: boolean;
  isProtected?: boolean;
  isVisible?: boolean;
  permission?: { area: number; acao: number };
  fullPath?: string;
  icon?: JSX.Element;
  group?: string;
  children?: Route[];
};
