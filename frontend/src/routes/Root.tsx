import { Outlet } from 'react-router';

export const Root = () => {
  return (
    <div className="flex h-dvh bg-background font-roboto">
      <Outlet />
    </div>
  );
};
