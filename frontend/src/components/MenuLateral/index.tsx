import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/hooks/useAuth';
import type { AuthPayload } from '@/types/auth.types';
import type { Route } from '@/types/routes.types';
import { Item } from './Item';
import { Lista } from './Lista';
import { Root } from './Root';

type MenuLateralProps = {
  routes: Route[];
};

const MenuLateral = ({ routes }: MenuLateralProps) => {
  const { auth } = useAuth();
  const token = auth?.token ? jwtDecode<AuthPayload>(auth.token) : null;

  return (
    <Root>
      <Lista>
        {routes.map(
          (route, index) =>
            route.isVisible &&
            (route.permission ? (
              token?.permissions.includes(route.permission) && (
                <Item key={index} name={route.name} path={route.path} />
              )
            ) : (
              <Item key={index} name={route.name} path={route.path} />
            ))
        )}
      </Lista>
    </Root>
  );
};

export default MenuLateral;
