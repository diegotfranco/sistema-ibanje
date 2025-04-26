import { Outlet } from "react-router-dom";

const Root = () => {
  return (
    <div className="flex h-dvh">
      <Outlet />
    </div>
  );
};

export default Root;
