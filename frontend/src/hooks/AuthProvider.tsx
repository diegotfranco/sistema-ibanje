import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Auth, AuthContextType } from "types/auth.types";
import { InternalAxiosRequestConfig } from "axios";
import axios from "./axios";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined)
    throw new Error("useAuth must be used within AuthProvider");

  return context;
};

type AuthProviderProps = { children: ReactNode };
type CustomConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await axios.get("/v1/usuario/login");
        setAuth(response.data.auth);
      } catch (error) {
        setAuth(null);
        console.log(error);
      }
    };

    fetchMe();
  }, []);

  useLayoutEffect(() => {
    const authInterceptor = axios.interceptors.request.use(
      (config: CustomConfig) => {
        config.headers.Authorization =
          !config._retry && auth
            ? `Bearer ${auth.token}`
            : config.headers.Authorization;
        return config;
      },
    );
    return () => {
      axios.interceptors.request.eject(authInterceptor);
    };
  }, [auth]);

  useLayoutEffect(() => {
    const refreshInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response.status === 403 &&
          error.response.data.message === "Unauthorized" //verificar 401 ou 403
        ) {
          try {
            const response = await axios.get("v1/usuario/refresh");
            setAuth(response.data.auth);
            originalRequest.headers.Authorization = `Bearer ${response.data.auth.token}`;
            originalRequest._retry = true;
            return axios(originalRequest);
          } catch (error) {
            setAuth(null);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => axios.interceptors.request.eject(refreshInterceptor);
  }, []);

  return (
    <AuthContext.Provider value={auth && { auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
