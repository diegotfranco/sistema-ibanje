import { useAuthStore } from '@/stores/useAuthStore';
import type { Route } from '@/types/routes.types';
import { Item } from './Item';
import { Lista } from './Lista';
import { Root } from './Root';

type MenuLateralProps = {
  routes: Route[];
};

const MenuLateral = ({ routes }: MenuLateralProps) => {
  const { decoded } = useAuthStore();

  return (
    <Root>
      <Lista>
        {routes.map((route, index) => {
          if (!route.isVisible) return null;

          const canAccess = !route.permission || decoded?.permissions?.includes(route.permission);

          return canAccess && <Item key={index} name={route.name} path={route.path} />;
        })}
      </Lista>
    </Root>
  );
};

export default MenuLateral;
