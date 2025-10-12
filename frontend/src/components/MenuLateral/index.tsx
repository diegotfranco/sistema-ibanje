import { useAuthStore } from '@/stores/useAuthStore';
import type { Route } from '@/types/routes.types';
import { Item } from './Item';
import { Lista } from './Lista';
import { Root } from './Root';
import { useLogout } from '@/hooks/useLogout';

type MenuLateralProps = {
  routes: Route[];
};

const MenuLateral = ({ routes }: MenuLateralProps) => {
  // const { user, can } = useAuthStore();
  const { can } = useAuthStore();
  const { logout, isPending } = useLogout();

  return (
    <Root>
      <div className="flex flex-col justify-between h-full">
        <Lista>
          {routes.map((route, index) => {
            if (!route.isVisible) return null;

            let canAccess = true;

            // Caso a rota defina uma permissão em formato { area, acao }
            if (route.permission && typeof route.permission === 'object') {
              const { area, acao } = route.permission;
              canAccess = can(area, acao);
            }

            // Ou se a rota define um papel (role)
            // if (route.role) {
            //   canAccess = user?.role === route.role;
            // }

            return canAccess ? (
              <Item key={index} name={route.name ?? 'Home'} path={route.path ?? '/'} />
            ) : null;
          })}
        </Lista>
        <button
          onClick={logout}
          disabled={isPending}
          className="mt-4 mb-6 text-sm text-amber-700 hover:text-amber-900 hover:underline disabled:opacity-50 cursor-pointer">
          {isPending ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </Root>
  );
};

export default MenuLateral;
