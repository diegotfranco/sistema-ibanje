import MenuLateral from 'components/MenuLateral';
import { PermissionGate } from 'routes/PermissionGate';
import type { Route } from 'types/routes.types';

export const MenuLayout = ({ routes, permission }: { routes: Route[]; permission?: string }) => (
  <PermissionGate permission={permission}>
    <MenuLateral routes={routes} />
  </PermissionGate>
);
