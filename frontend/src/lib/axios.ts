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
    if (error.response?.status === 401) {
      handleSessionExpired();
    }
    return Promise.reject(error);
  }
);

export default _axios;
