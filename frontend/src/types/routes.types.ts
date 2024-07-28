import { RouteObject } from "react-router-dom";

type Route = RouteObject & {
  name: string;
};

export default Route;