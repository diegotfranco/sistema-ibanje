import { createBrowserRouter } from "react-router-dom";
import Home from "pages/Home";
import Login from "pages/Login";
import Error from "pages/Error";
import Saidas from "pages/Saidas";
import Entradas from "pages/Entradas";
import Dashboard from "pages/Dashboard";
import Unauthorized from "pages/Unauthorized";
import MenuLateral from "components/MenuLateral";
import type Route from "types/routes.types";
import RoutesEnum from "enums/routes.enum";
import ProtectedRoute from "./ProtectedRoute";
import Root from "./Root";

const createProtectedRoute = (element: JSX.Element): JSX.Element => (
  <ProtectedRoute>
    <MenuLateral>{element}</MenuLateral>
  </ProtectedRoute>
);

export const routes: Route[] = [
  {
    index: true,
    element: <Home />,
    name: "Home",
  },
  {
    path: RoutesEnum.LOGIN,
    element: <Login />,
    name: "Login",
  },
  {
    path: RoutesEnum.UNAUTHORIZED,
    element: <Unauthorized />,
    name: "Não Autorizado",
  },
  {
    path: RoutesEnum.DASHBOARD,
    element: createProtectedRoute(<Dashboard />),
    name: "Dashboard",
  },
  {
    path: RoutesEnum.ENTRADAS,
    element: createProtectedRoute(<Entradas />),
    name: "Entradas",
  },
  {
    path: RoutesEnum.SAIDAS,
    element: createProtectedRoute(<Saidas />),
    name: "Saídas",
  },
];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <Error />,
    children: routes,
  },
]);
