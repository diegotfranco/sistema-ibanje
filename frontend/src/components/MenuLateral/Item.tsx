import { NavLink, useLocation } from 'react-router';
import clsx from 'clsx';

type ItemProps = {
  name: string;
  path: string;
};

export const Item = ({ name, path }: ItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  return (
    <NavLink
      to={path}
      className={clsx(
        'px-4 py-2 rounded-md transition-colors',
        'text-slate-700 hover:text-teal-700 hover:bg-teal-50',
        isActive && 'font-semibold text-teal-700 bg-teal-100'
      )}>
      {name}
    </NavLink>
  );
};
