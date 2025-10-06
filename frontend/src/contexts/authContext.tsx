import { createContext, useState } from "react";
import type {
  Auth,
  AuthContextType,
  AuthProviderProps,
} from "../types/auth.types";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [auth, setAuth] = useState<Auth | null>(null);
  // const [auth, setAuth] = useState<Auth | null>( {email:"a@b.com", token: "1726reashjdbaosuydtg2q"} );

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
