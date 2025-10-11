import MenuLateral from '@/components/MenuLateral';
import type { Route } from '@/types/routes.types';
import type { ReactNode } from 'react';

interface MenuLayoutProps {
  routes: Route[];
  children?: ReactNode;
}

export const MenuLayout = ({ routes, children }: MenuLayoutProps) => (
  <div className="flex">
    <MenuLateral routes={routes} />
    <main className="flex-1 p-6">{children}</main>
  </div>
);
