import { handleSessionExpired } from '@/lib/session';
import axios, { type AxiosInstance } from 'axios';

const _axios: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: Number(import.meta.env.VITE_TIMEOUT ?? 60000)
});

_axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // If any API call (that is not a login attempt) returns a 401, handle it as a session expiry.
    if (error.response?.status === 401 && originalRequest && !originalRequest.url?.endsWith('/auth/login')) {
      handleSessionExpired();
    }
    return Promise.reject(error);
  }
);

export default _axios;
