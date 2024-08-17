import { Dispatch, ReactNode, SetStateAction } from "react";

type Auth = {
  email: string;
  token: string;
};
type AuthContextType = {
  auth: Auth | null;
  setAuth: Dispatch<SetStateAction<Auth | null>>;
};

type AuthProviderProps = {
  children: ReactNode;
};
export type { Auth, AuthContextType, AuthProviderProps };

