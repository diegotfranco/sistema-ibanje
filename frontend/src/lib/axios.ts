import axios, { type AxiosInstance } from 'axios';

const _axios: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // <-- enables sending cookies
  timeout: Number(import.meta.env.VITE_TIMEOUT ?? 60000)
});

// Optional: you can still log baseURL/environment if you want
console.log(import.meta.env.VITE_API_URL, import.meta.env.MODE, import.meta.env.VITE_APP_NAME);

// --- Response Interceptor (optional cleanup/logging)
_axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default _axios;
