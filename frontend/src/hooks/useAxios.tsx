import axios, { InternalAxiosRequestConfig } from "axios";
import { useLayoutEffect } from "react";
import { useAuth } from "./useAuth";

const _axios = axios.create({
  baseURL: import.meta.env.BASE_URL,
  withCredentials: true,
  timeout: 600000,
});

type CustomConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};
const useAxios = () => {
  const { auth, setAuth } = useAuth();

  useLayoutEffect(() => {
    const authInterceptor = _axios.interceptors.request.use(
      (config: CustomConfig) => {
        config.headers.Authorization =
          !config._retry && auth
            ? `Bearer ${auth.token}`
            : config.headers.Authorization;
        return config;
      },
    );
    return () => {
      _axios.interceptors.request.eject(authInterceptor);
    };
  }, [auth]);

  useLayoutEffect(() => {
    const refreshInterceptor = _axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response.status === 403 &&
          error.response.data.message === "Unauthorized" //verificar 401 ou 403
        ) {
          try {
            const response = await _axios.get("v1/usuario/refresh");
            setAuth(response.data.auth);
            originalRequest.headers.Authorization = `Bearer ${response.data.auth.token}`;
            originalRequest._retry = true;
            return _axios(originalRequest);
          } catch (error) {
            setAuth(null);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => _axios.interceptors.request.eject(refreshInterceptor);
  }, []);
  return _axios;
};

export default useAxios;
