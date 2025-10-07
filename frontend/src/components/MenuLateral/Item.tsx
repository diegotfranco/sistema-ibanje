import { Link } from 'react-router';

type MenuItemProps = {
  name?: string;
  path?: string;
};

export const Item = ({ name = 'Home', path = '/' }: MenuItemProps) => {
  return (
    <Link to={path} className="hover:underline text-amber-800">
      {name}
    </Link>
  );
};
