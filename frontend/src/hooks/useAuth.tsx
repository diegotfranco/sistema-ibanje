import { createContext, useContext, useState } from "react";
import { Auth, AuthContextType, AuthProviderProps } from "types/auth.types";

const AuthContext = createContext<AuthContextType>({
  auth: null,
  setAuth: () => undefined,
});
// const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error("useAuth must be used within AuthProvider");

  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<Auth | null>(null);

  // useEffect(() => {
  //   const fetchMe = async () => {
  //     try {
  //       const response = await axios.get("/v1/usuario/login");
  //       setAuth(response.data.auth);
  //     } catch (error) {
  //       setAuth(null);
  //       console.log(error);
  //     }
  //   };

  //   fetchMe();
  // }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
